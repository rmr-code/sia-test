import { useState, useEffect, useRef } from 'react';

const AgentDemo = ({agentData}) => {
  const iframeref = useRef()
  const deltaH = 36 // to match the p-4 in chat + border-1
  const [frameheight, setFrameheight] = useState(`${deltaH}px`)

  useEffect(() => {
    const handleIframeMessage = (event) => {
        if (event.data.type === "iframeHeight") {
          setFrameheight(`${event.data.height + deltaH}px`);
        }
      };
  
      window.addEventListener("message", handleIframeMessage);
      return () => window.removeEventListener("message", handleIframeMessage);
}, [])

  return (
    <div className="mt-6">
      <div className='border-2 border-gray-200'>
        <iframe ref={iframeref} className='w-full max-w-2xl overflow-hidden' width="100%" height={frameheight} src={`/chat/${agentData.name}`}/>
      </div>
    </div>
  )
};

export default AgentDemo;
