import { useEffect, useState } from 'react';

const StreamingMessages = ({route}) => {
  console.log('STREAMING')
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    console.log('use effect in Streaming Messages')
    // Open the SSE connection
    const eventSource = new EventSource(route);

    // Listen for messages from the backend
    eventSource.onmessage = (event) => {
      console.log("HERE")
      setMessages((prevMessages) => [...prevMessages, event.data]);
    };

    eventSource.onerror = (event) => {
      console.error("SSE error:", event);
      eventSource.close();  // Close the connection on error
    };

    // Clean up the event source on component unmount
    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div>
      <label>Processing Status:</label>
      <ul>
        {messages.map((message, index) => (
          <li key={index}>{message}</li>
        ))}
      </ul>
    </div>
  );
};

export default StreamingMessages;
