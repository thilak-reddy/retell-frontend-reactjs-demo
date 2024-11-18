import React, { useEffect, useState, useRef } from "react";
import "./App.css";
import { RetellWebClient } from "retell-client-js-sdk";

const App = () => {
  const [isCalling, setIsCalling] = useState(false);
  const [chatTitle, setChatTitle] = useState("Chatterbox AI Voice Demo");
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);
  const retellWebClientRef = useRef(new RetellWebClient());

  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const iframeAgentId = urlParams.get('agentId');
      const iframeTitle = urlParams.get('title');
      
      if (iframeAgentId) {
        setCurrentAgentId(iframeAgentId);
        // console.log("Setting agent ID:", iframeAgentId);
      }
      if (iframeTitle) {
        setChatTitle(decodeURIComponent(iframeTitle));
        // console.log("Setting title:", iframeTitle);
      }
    } catch (e) {
      console.error("Error accessing URL parameters:", e);
    }
  }, []);

  interface RegisterCallResponse {
    access_token: string;
  }

  // Update the second useEffect to use the ref
  useEffect(() => {
    const client = retellWebClientRef.current;
    
    client.on("call_started", () => {
      // console.log("call started");
    });
    
    client.on("call_ended", () => {
      // console.log("call ended");
      setIsCalling(false);
    });
    
    client.on("agent_start_talking", () => {
      // console.log("agent_start_talking");
    });
    
    client.on("agent_stop_talking", () => {
      // console.log("agent_stop_talking");
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
      // console.error("An error occurred:", error);
      client.stopCall();
    });

    // Cleanup function to remove listeners
    return () => {
      client.removeAllListeners();
    };
  }, []); // Empty dependency array is now fine since we're using ref

  // Update toggleConversation to use currentAgentId
  const toggleConversation = async () => {
    if (!currentAgentId) {
      console.error("No agent ID provided");
      return;
    }

    if (isCalling) {
      retellWebClientRef.current.stopCall();
    } else {
      const registerCallResponse = await registerCall(currentAgentId);
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
          {currentAgentId ? (
            <>
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
            </>
          ) : (
            <div className="error-message">
              No agent ID provided. Please add ?agentId=your_agent_id to the URL.
            </div>
          )}
        </div>
      </header>
    </div>
  );
};

export default App;
