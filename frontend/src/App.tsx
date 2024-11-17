import React, { useEffect, useState, useRef } from "react";
import "./App.css";
import { RetellWebClient } from "retell-client-js-sdk";

// Updated from const to let to allow reassignment
let agentId = "agent_99f45564720a36a31d2778cdeb";

// Add this interface at the top of your file
interface IframeParameters {
  agentId?: string;
  title?: string;
}

const App = () => {
  const [isCalling, setIsCalling] = useState(false);
  const [chatTitle, setChatTitle] = useState("Chatterbox AI Voice Demo");
  const retellWebClientRef = useRef(new RetellWebClient());

  useEffect(() => {
    try {
      // Get and parse URL parameters in a structured way
      const params: IframeParameters = {
        agentId: new URLSearchParams(window.location.search).get('agentId') || undefined,
        title: new URLSearchParams(window.location.search).get('title') || undefined
      };

      // Apply parameters if they exist
      if (params.agentId) {
        agentId = params.agentId;
        console.log("Setting agent ID:", params.agentId);
      }
      if (params.title) {
        setChatTitle(params.title);
        console.log("Setting title:", params.title);
      }
    } catch (e) {
      console.error("Error accessing iframe parameters:", e);
    }
  }, []);

  interface RegisterCallResponse {
    access_token: string;
  }

  // Update the second useEffect to use the ref
  useEffect(() => {
    const client = retellWebClientRef.current;
    
    client.on("call_started", () => {
      console.log("call started");
    });
    
    client.on("call_ended", () => {
      console.log("call ended");
      setIsCalling(false);
    });
    
    client.on("agent_start_talking", () => {
      console.log("agent_start_talking");
    });
    
    client.on("agent_stop_talking", () => {
      console.log("agent_stop_talking");
    });
    
    client.on("audio", (audio) => {
      // console.log(audio);
    });
    
    client.on("update", (update) => {
      // console.log(update);
    });
    
    client.on("metadata", (metadata) => {
      // console.log(metadata);
    });
    
    client.on("error", (error) => {
      console.error("An error occurred:", error);
      client.stopCall();
    });

    // Cleanup function to remove listeners
    return () => {
      client.removeAllListeners();
    };
  }, []); // Empty dependency array is now fine since we're using ref

  // Update toggleConversation to use the ref
  const toggleConversation = async () => {
    if (isCalling) {
      retellWebClientRef.current.stopCall();
    } else {
      const registerCallResponse = await registerCall(agentId);
      if (registerCallResponse.access_token) {
        retellWebClientRef.current
          .startCall({
            accessToken: registerCallResponse.access_token,
          })
          .catch(console.error);
        setIsCalling(true);
      }
    }
  };

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

  async function registerCall(agentId: string): Promise<RegisterCallResponse> {
    try {
      const response = await fetch(`${API_URL}/create-web-call`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent_id: agentId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: RegisterCallResponse = await response.json();
      return data;
    } catch (error) {
      console.error("Error registering call:", error);
      setIsCalling(false); // Reset state on error
      throw error;
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <div className="chat-container">
          <h1 className="chat-title">{chatTitle}</h1>
          <button 
            onClick={toggleConversation}
            className={`chat-button ${isCalling ? 'active' : ''}`}
          >
            {isCalling ? "End Call" : "Start Conversation"}
          </button>
          
          {isCalling && (
            <div className="status-indicator pulse">
              Call in progress...
            </div>
          )}
        </div>
      </header>
    </div>
  );
};

export default App;
