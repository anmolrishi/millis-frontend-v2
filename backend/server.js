const express = require("express");
const cors = require("cors");
const axios = require("axios");
const admin = require("firebase-admin");
const serviceAccount = require("./firebase-config.json");
const https = require("https");
const fs = require("fs");
const os = require("os");
const path = require("path");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Firebase Admin with service account
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "ai-voicebot-89571.appspot.com",
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// Initialize Melis-ai client configuration
const MILLIS_API_URL = "https://api-west.millis.ai";
const MILLIS_TOKEN = "mnCNFbmEfKFuXRCggRpHu54nAyaHXDPx";
const MILLIS_AUTH = "zhdHCri7tl3TlxZoYTGOkeiKMF0KAkba";

// Configure axios defaults for Millis-ai
const millisApi = axios.create({
  baseURL: MILLIS_API_URL,
  headers: {
    token: MILLIS_TOKEN,
    authorization: MILLIS_AUTH,
    "Content-Type": "application/json",
  },
});

// WebRTC endpoints
app.post("/api/webrtc/offer", async (req, res) => {
  try {
    console.log("Received WebRTC offer:", req.body);

    const { agent_id, offer } = req.body;

    if (!agent_id || !offer) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    const response = await millisApi.post("/webrtc/offer", {
      agent_id: agent_id,
      offer: offer,
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error handling WebRTC offer:", error);
    res.status(500).json({
      success: false,
      error: "Failed to handle WebRTC offer",
    });
  }
});

app.post("/api/webrtc/ice-candidate", async (req, res) => {
  try {
    const { agent_id, candidate } = req.body;

    if (!agent_id || !candidate) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    const response = await millisApi.post("/webrtc/ice-candidate", {
      agent_id,
      candidate,
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error handling ICE candidate:", error);
    res.status(500).json({
      success: false,
      error: "Failed to handle ICE candidate",
    });
  }
});

// List voices endpoint
app.get("/api/list-voices", async (req, res) => {
  try {
    const voiceResponses = await millisApi.get("/voices?language=en");

    res.json({
      success: true,
      voices: voiceResponses.data,
    });
  } catch (error) {
    console.error("Error listing voices:", error);
    res.status(500).json({
      success: false,
      error: "Failed to list voices",
    });
  }
});

// List knowledge bases endpoint
app.get("/api/list-knowledge-bases", async (req, res) => {
  try {
    const knowledgeBases = await millisApi.get("/knowledge-bases");
    res.json(knowledgeBases.data);
  } catch (error) {
    console.error("Error listing knowledge bases:", error);
    res.status(500).json({
      success: false,
      error: "Failed to list knowledge bases",
    });
  }
});

// List agents endpoint
app.get("/api/list-agents", async (req, res) => {
  try {
    const { user_id, workspace_id } = req.query;

    if (!user_id || !workspace_id) {
      return res.status(400).json({
        success: false,
        error: "User ID and workspace ID are required",
      });
    }

    // Get agents from Firestore
    const agentsRef = db
      .collection("users")
      .doc(user_id)
      .collection("workspaces")
      .doc(workspace_id)
      .collection("agents");

    const agentsSnapshot = await agentsRef.get();

    const agents = [];
    // Transform the data to include model and voice info
    agentsSnapshot.forEach((doc) => {
      const data = doc.data();
      const voiceInfo = data.config?.voice || {};
      const llmInfo = data.config?.llm || {};

      agents.push({
        agent_id: doc.id,
        name: data.name,
        model: llmInfo.model || "Unknown",
        voice: {
          provider: voiceInfo.provider || "Unknown",
          name: voiceInfo.name || "Unknown",
        },
        created_at: data.created_at,
        updated_at: data.updated_at,
      });
    });

    res.json({
      success: true,
      agents,
    });
  } catch (error) {
    console.error("Error listing agents:", error);
    res.status(500).json({
      success: false,
      error: "Failed to list agents",
    });
  }
});

// Create knowledge base endpoint
app.post("/api/create-knowledge-base", async (req, res) => {
  try {
    const {
      user_id,
      workspace_id,
      knowledge_base_name,
      document_urls,
      type,
      text_content,
    } = req.body;

    if (!user_id || !workspace_id || !knowledge_base_name) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    let knowledgeBaseParams = {
      name: knowledge_base_name,
    };

    // Create temp directory for file downloads
    const tempDir = path.join(os.tmpdir(), "kb-files");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // Handle different types of content
    switch (type) {
      case "webpages":
        if (!document_urls?.length) {
          return res.status(400).json({
            success: false,
            error: "No URLs provided for webpage type",
          });
        }
        knowledgeBaseParams.urls = document_urls;
        break;

      case "files":
        if (!document_urls?.length) {
          return res.status(400).json({
            success: false,
            error: "No file URLs provided",
          });
        }

        try {
          // Download files from Firebase Storage URLs and create read streams
          const fileStreams = await Promise.all(
            document_urls.map(async (url) => {
              const tempFilePath = path.join(tempDir, `file-${Date.now()}`);

              // Download file from Firebase Storage URL
              await new Promise((resolve, reject) => {
                https
                  .get(url, (response) => {
                    const fileStream = fs.createWriteStream(tempFilePath);
                    response.pipe(fileStream);
                    fileStream.on("finish", () => {
                      fileStream.close();
                      resolve();
                    });
                  })
                  .on("error", reject);
              });

              // Create read stream from downloaded file
              return fs.createReadStream(tempFilePath);
            }),
          );

          knowledgeBaseParams.files = fileStreams;
        } catch (error) {
          console.error("Error processing files:", error);
          throw new Error("Failed to process files");
        }
        break;

      case "text":
        if (!text_content) {
          return res.status(400).json({
            success: false,
            error: "No text content provided",
          });
        }

        knowledgeBaseParams.texts = [
          {
            text: text_content,
            title: `Manual Entry ${new Date().toISOString()}`,
          },
        ];
        break;

      default:
        return res.status(400).json({
          success: false,
          error: "Invalid content type",
        });
    }

    // Create knowledge base in Millis-ai
    const knowledgeBaseResponse = await millisApi.post(
      "/knowledge-bases",
      knowledgeBaseParams,
    );
    const knowledgeBase = knowledgeBaseResponse.data;

    // Clean up temp files
    if (type === "files") {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    // Save to Firestore
    const kbRef = db
      .collection("users")
      .doc(user_id)
      .collection("workspaces")
      .doc(workspace_id)
      .collection("knowledge_bases")
      .doc(knowledgeBase.id);

    await kbRef.set({
      ...knowledgeBase,
      type,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      created_by: user_id,
    });

    res.json({
      success: true,
      knowledge_base: knowledgeBase,
    });
  } catch (error) {
    console.error("Error creating knowledge base:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create knowledge base",
    });
  }
});

// Resync knowledge base endpoint
app.post("/api/resync-knowledge-base/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await millisApi.post(`/knowledge-bases/${id}/refresh`);

    res.json({
      success: true,
      message: "Knowledge base refresh initiated",
    });
  } catch (error) {
    console.error("Error resyncing knowledge base:", error);
    res.status(500).json({
      success: false,
      error: "Failed to resync knowledge base",
    });
  }
});

// Delete knowledge base endpoint
app.delete("/api/delete-knowledge-base/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await millisApi.delete(`/knowledge-bases/${id}`);

    res.json({
      success: true,
      message: "Knowledge base deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting knowledge base:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete knowledge base",
    });
  }
});

// Create agent endpoint
app.post("/api/create-agent", async (req, res) => {
  try {
    const { user_id, workspace_id, agent_data } = req.body;

    if (!user_id || !workspace_id || !agent_data) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Create agent in Millis-ai
    const millisAgentResponse = await millisApi.post("/agents", {
      name: "New Agent",
      config: {
        prompt: "",
        voice: {
          provider: agent_data.voice.provider,
          voice_id: agent_data.voice.voice_id,
          model: agent_data.voice.model || "eleven_turbo_v2_5",
          settings: {},
        },
        llm: {
          model: "gpt-4o",
          temperature: 0,
          history_settings: {
            history_message_limit: 10,
            history_tool_result_limit: 5,
          },
        },
        flow: {
          user_start_first: false,
          interruption: {
            allowed: true,
            keep_interruption_message: true,
            first_messsage: true,
          },
          response_delay: 0,
          auto_fill_responses: {
            response_gap_threshold: 0,
            messages: ["Um", "Okay"],
          },
          agent_terminate_call: {
            enabled: true,
            instruction: "End the call when appropriate",
            messages: [],
          },
          voicemail: {
            action: "hangup",
            message: "",
            continue_on_voice_activity: true,
          },
          call_transfer: {
            phone: "",
            instruction: "",
            messages: [],
          },
          inactivity_handling: {
            idle_time: 30000,
            message:
              "I haven't heard from you in a while. Are you still there?",
          },
          dtmf_dial: {
            enabled: false,
            instruction: "",
          },
        },
        first_message: "",
        tools: [],
        millis_functions: [],
        app_functions: [],
        language: "en-US",
        vad_threshold: 0.5,
        session_timeout: {
          max_duration: 3600000,
          max_idle: 300000,
          message: "Session timeout reached",
        },
        privacy_settings: {
          opt_out_data_collection: false,
          do_not_call_detection: false,
        },
        custom_vocabulary: {
          keywords: {},
        },
        speech_to_text: {
          provider: "deepgram",
          multilingual: true,
        },
        call_settings: {
          enable_recording: true,
        },
      },
    });

    const agent_id = millisAgentResponse.data.id;

    // Save to Firestore
    const agentRef = db
      .collection("users")
      .doc(user_id)
      .collection("workspaces")
      .doc(workspace_id)
      .collection("agents")
      .doc(agent_id);

    await agentRef.set({
      agent_id,
      ...millisAgentResponse.data, // Save the complete agent data
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({
      success: true,
      agent_id,
      agent: millisAgentResponse.data, // Return complete agent data
    });
  } catch (error) {
    console.error("Error creating agent:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create agent",
    });
  }
});

// Get agent endpoint
app.get("/api/get-agent", async (req, res) => {
  try {
    const { agent_id } = req.query;

    if (!agent_id) {
      return res.status(400).json({
        success: false,
        error: "Agent ID is required",
      });
    }

    // Get agent details from Millis-ai
    const agentResponse = await millisApi.get(`/agents/${agent_id}`);
    const agentData = agentResponse.data;

    console.log(agentData);

    res.json({
      success: true,
      agent: agentData,
    });
  } catch (error) {
    console.error("Error retrieving agent:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve agent",
    });
  }
});

// Start web call endpoint
app.post("/api/start-web-call", async (req, res) => {
  try {
    const { agent_id } = req.body;

    if (!agent_id) {
      return res.status(400).json({
        success: false,
        error: "Agent ID is required",
      });
    }

    // Create web call using Millis-ai client
    const webCallResponse = await millisApi.post("/calls/web", { agent_id });

    res.json({
      success: true,
      accessToken: webCallResponse.data.access_token,
    });
  } catch (error) {
    console.error("Error starting web call:", error);
    res.status(500).json({
      success: false,
      error: "Failed to start web call",
    });
  }
});

// Update agent endpoint
app.post("/api/update-agent", async (req, res) => {
  try {
    const { user_id, workspace_id, agent_data } = req.body;

    if (!user_id || !workspace_id || !agent_data?.id) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Update agent in Millis-ai
    const updateData = {
      name: agent_data.name,
      config: {
        prompt: agent_data.config?.prompt || "",
        voice: {
          provider: agent_data.config?.voice?.provider,
          voice_id: agent_data.config?.voice?.voice_id,
          model: agent_data.config?.voice?.model,
          settings: {},
        },
        llm: {
          model: "gpt-4o",
          temperature: 0.5,
          history_settings: {
            history_message_limit: 10,
            history_tool_result_limit: 5,
          },
        },
        flow: {
          user_start_first: false,
          interruption: {
            allowed: agent_data.config?.flow?.interruption?.allowed || true,
            keep_interruption_message: true,
            first_messsage: true,
          },
          response_delay: agent_data.config?.flow?.response_delay || 0,
          agent_terminate_call: {
            enabled: agent_data.config?.flow?.agent_terminate_call?.enabled || false,
            instruction: agent_data.config?.flow?.agent_terminate_call?.instruction || "",
            messages: agent_data.config?.flow?.agent_terminate_call?.messages || [],
          },
          call_transfer: {
            phone: agent_data.config?.flow?.call_transfer?.phone || "",
            instruction: agent_data.config?.flow?.call_transfer?.instruction || "",
            messages: agent_data.config?.flow?.call_transfer?.messages || [],
          },
          dtmf_dial: {
            enabled: agent_data.config?.flow?.dtmf_dial?.enabled || false,
            instruction: agent_data.config?.flow?.dtmf_dial?.instruction || "",
          },
          inactivity_handling: {
            idle_time:
              agent_data.config?.flow?.inactivity_handling?.idle_time || 30000,
            message:
              "I haven't heard from you in a while. Are you still there?",
          },
        },
        first_message: agent_data.config?.first_message || "",
        tools: agent_data.config?.tools || [],
        language: agent_data.config?.language || "en-US",
        session_data_webhook: agent_data.config?.session_data_webhook || "",
        extra_prompt_webhook: agent_data.config?.extra_prompt_webhook || "",
        privacy_settings: {
          opt_out_data_collection: false,
          do_not_call_detection: false,
        },
        speech_to_text: {
          provider: "deepgram",
          multilingual: true,
        },
        call_settings: {
          enable_recording: true,
        },
      },
    };

    await millisApi.put(`/agents/${agent_data.id}`, updateData);

    // Update in Firestore
    const agentRef = db
      .collection("users")
      .doc(user_id)
      .collection("workspaces")
      .doc(workspace_id)
      .collection("agents")
      .doc(agent_data.id);

    await agentRef.set(
      {
        ...agent_data,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    res.json({
      success: true,
      message: "Agent updated successfully",
    });
  } catch (error) {
    console.error("Error updating agent:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update agent",
    });
  }
});

// List phone numbers endpoint
app.get("/api/list-phone-numbers", async (req, res) => {
  try {
    const phoneNumbers = await millisApi.get("/phone-numbers");
    res.json(phoneNumbers.data);
  } catch (error) {
    console.error("Error listing phone numbers:", error);
    res.status(500).json({
      success: false,
      error: "Failed to list phone numbers",
    });
  }
});

// Create phone number endpoint
app.post("/api/create-phone-number", async (req, res) => {
  try {
    const { user_id, workspace_id, area_code } = req.body;

    if (!user_id || !workspace_id || !area_code) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Create phone number in Millis-ai
    const phoneNumberResponse = await millisApi.post("/phone-numbers", {
      area_code,
    });

    console.log(phoneNumberResponse);

    // Save to Firestore
    const phoneNumberRef = db
      .collection("users")
      .doc(user_id)
      .collection("workspaces")
      .doc(workspace_id)
      .collection("phone_numbers")
      .doc(phoneNumberResponse.data.phone_number);

    await phoneNumberRef.set({
      ...phoneNumberResponse.data,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({
      success: true,
      phone_number: phoneNumberResponse.data,
    });
  } catch (error) {
    console.error("Error creating phone number:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create phone number",
    });
  }
});

// Update phone number endpoint
app.post("/api/update-phone-number", async (req, res) => {
  console.log("update phone number");
  console.log(req.body);
  try {
    const {
      user_id,
      workspace_id,
      phone_number,
      nickname,
      inbound_agent_id,
      outbound_agent_id,
    } = req.body;

    if (!phone_number) {
      return res.status(400).json({
        success: false,
        error: "Phone number is required",
      });
    }

    const updateData = {
      nickname,
      inbound_agent_id,
      outbound_agent_id,
    };

    // Remove undefined values
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key],
    );

    const phoneNumberResponse = await millisApi.put(
      `/phone-numbers/${phone_number}`,
      updateData,
    );

    const phoneNumberRef = db
      .collection("users")
      .doc(user_id)
      .collection("workspaces")
      .doc(workspace_id)
      .collection("phone_numbers")
      .doc(phoneNumberResponse.data.phone_number);

    await phoneNumberRef.set({
      ...phoneNumberResponse.data,
    });

    res.json({
      success: true,
      message: "Phone number updated successfully",
    });
  } catch (error) {
    console.error("Error updating phone number:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update phone number",
    });
  }
});

// Delete phone number endpoint
app.delete("/api/delete-phone-number/:phone_number", async (req, res) => {
  try {
    const { phone_number } = req.params;

    await millisApi.delete(`/phone-numbers/${phone_number}`);

    res.json({
      success: true,
      message: "Phone number deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting phone number:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete phone number",
    });
  }
});

// Make outbound call endpoint
app.post("/api/make-outbound-call", async (req, res) => {
  try {
    const { from_phone_number, to_phone_number } = req.body;

    if (!from_phone_number || !to_phone_number) {
      return res.status(400).json({
        success: false,
        error: "Phone number is required",
      });
    }

    const callResponse = await millisApi.post("/calls/outbound", {
      from_number: from_phone_number,
      to_number: to_phone_number,
    });

    res.json({
      success: true,
      call: callResponse.data,
    });
  } catch (error) {
    console.error("Error making outbound call:", error);
    res.status(500).json({
      success: false,
      error: "Failed to make outbound call",
    });
  }
});

app.post("/api/webhook", async (req, res) => {
  console.log("Webhook triggered");
  console.log(req.body);

  // Step 1: Check if the event is 'call_analyzed'
  if (req.body.event !== "call_analyzed") {
    console.log(`Event '${req.body.event}' is not 'call_analyzed'. Ignoring.`);
    return res.sendStatus(200);
  }

  const call = req.body.call;
  const agentId = call.agent_id;
  const callId = call.call_id;

  if (!agentId || !callId) {
    console.error("Missing agent_id or call_id in the request body.");
    return res.status(400).send("Bad Request: Missing agent_id or call_id.");
  }

  try {
    // Step 2: Use a Collection Group Query to find the agent document
    console.log(agentId);
    const agentQuerySnapshot = await db
      .collectionGroup("agents")
      .where("agent_id", "==", agentId)
      .orderBy("created_at", "desc")
      .limit(1) // Assuming agent_id is unique
      .get();

    if (agentQuerySnapshot.empty) {
      console.warn(`Agent ID '${agentId}' not found in Firestore.`);
      return res.sendStatus(200); // Optionally, you might want to respond differently
    }

    // Assuming agent_id is unique and only one document is found
    const agentDoc = agentQuerySnapshot.docs[0];
    const agentRef = agentDoc.ref;

    // Navigate up the document hierarchy to get workspace and user
    const workspaceRef = agentRef.parent.parent;
    if (!workspaceRef) {
      console.error("Workspace reference not found for the agent.");
      return res
        .status(500)
        .send("Internal Server Error: Workspace not found.");
    }

    const userRef = workspaceRef.parent.parent;
    if (!userRef) {
      console.error("User reference not found for the workspace.");
      return res.status(500).send("Internal Server Error: User not found.");
    }

    const userId = userRef.id;
    const workspaceId = workspaceRef.id;

    console.log(
      `Agent ID '${agentId}' belongs to User ID '${userId}' and Workspace ID '${workspaceId}'.`,
    );

    // Step 3: Create a new document in 'call_history' sub-collection
    console.log(userId);
    console.log(workspaceId);
    console.log(callId);
    const callHistoryRef = db
      .collection("users")
      .doc(userId)
      .collection("workspaces")
      .doc(workspaceId)
      .collection("call_history")
      .doc(callId);

    // Set the entire call data. Adjust as needed (e.g., exclude sensitive info)

    console.log(call);
    await callHistoryRef.set(call);

    console.log(`Call ID '${callId}' has been saved to 'call_history'.`);

    // Respond with 200 OK
    res.sendStatus(200);
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).send("Internal Server Error");
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
