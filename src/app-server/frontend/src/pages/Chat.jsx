import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';
import { HiArrowCircleUp } from "react-icons/hi";
import axios from 'axios';
import ErrorBlock from '../components/ui/ErrorBlock';

const Chat = () => {

  const { agentname } = useParams();
  const { baseUrl, X_REQUEST_STR } = useAuth()
  const containerRef = useRef(null)
  const buttonRef = useRef(null)
  const inputRef = useRef(null)
  const [containerHeight, setContainerHeight] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null);

  const [agentData, setAgentData] = useState({
    name: '',
    welcome_message: 'Hello! How can I help you today?',
    suggested_prompts: ['', '', ''],
    status: '',
  });

  const [messages, setMessages] = useState([
    { content: agentData.welcome_message, role: 'system' },
  ]);
  const [input, setInput] = useState('');

  const handleSendMessage = async () => {
    console.log('message is:', input)
    if (input.trim()) {
      const datatoadd = []
      // send the input and messages history
      let data = {
        "input": input,
        "messages": messages
      }
      // add user request
      datatoadd.push({ content: input, role: 'user' })
      setMessages([...messages, ...datatoadd]);
      // reset input
      setInput('');
      setLoading(true)
      try {
        // submit to server
        const url = `/api/chat/${agentData.name}`
        const headers = { headers: { 'Content-Type': 'application/json', 'Accept': 'text/plain;charset=utf-8' } }
        // await response from api call
        const response = await axios.post(url, data, headers)
        // add response to message
        datatoadd.push({ content: response.data.content, role: response.data.role })
        setMessages([...messages, ...datatoadd]);
        // stop loading
        setLoading(false)
      } catch (err) {
        console.log(err);
        setLoading(false)
      }
    }
  }

  const handleSuggestedPrompt = (index) => {
    if (index >= 0 && index < agentData.suggested_prompts.length) {
      setInput(agentData.suggested_prompts[index])
      inputRef.current.focus()
    }
  }

  useEffect(() => {
    const handleResize = (entry) => {
      setContainerHeight(entry.contentRect.height);
      window.parent.postMessage({ type: "iframeHeight", height: entry.contentRect.height }, location.href);
    };

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        handleResize(entry)
      }
    });

    resizeObserver.observe(containerRef.current);

    if (agentname) {
      fetchAgentData(agentname)
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const fetchAgentData = async (agentname) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${baseUrl}/api/chat/${agentname}`, {
        withCredentials: true,
        headers: { 'X-Requested-With': X_REQUEST_STR },
      });
      const data = response.data;
      if (data) {
        // Ensure suggested_prompts has 3 elements
        if (data.suggested_prompts.length < 3) {
          data.suggested_prompts = [...data.suggested_prompts, ...Array(3 - data.suggested_prompts.length).fill('')];
        }
        if (data.welcome_message) {
          setMessages([
            { content: data.welcome_message, role: 'system' },
          ])
        }
        console.log(data)
        setAgentData(data);
      }
    } catch (err) {
      setError('Failed to load agent data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col h-max p-4 w-full">
      <div className="flex flex-row gap-4 w-full">
        {agentData.suggested_prompts.map((prompt, index) => {
          return (<div key={index} onClick={(e) => handleSuggestedPrompt(index)} className="flex-1 cursor-pointer rounded-lg bg-gray-100 text-xs font-thin text-gray-800 p-4 border border-gray-200">{prompt}</div>)
        })}

      </div>
      <div className="flex-1 overflow-y-auto mb-4">
        {messages.map((message) => (
          message.role === 'user' ?
            (<div key={message.id} className={'my-2 p-2 rounded-lg bg-gray-100 text-gray-800 self-end text-right'}>
              {message.content}
            </div>)
            :
            (<div key={message.id} className={'my-2 p-2 text-black self-start'}>
              {message.content}
            </div>)

        ))}
      </div>
      {!loading &&
        <div className="flex items-center rounded-full bg-gray-100 px-4 py-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message your smart agent"
            rows="1"
            className="flex-1 bg-transparent resize-none outline-none overflow-hidden"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <button ref={buttonRef} className='cursor-pointer' onClick={handleSendMessage} ><HiArrowCircleUp className='text-3xl' /></button>
        </div>
      }
      {error && <ErrorBlock>{error}</ErrorBlock>}
      {loading && <div className="px-2 font-thin text-xs md:text-sm lg:text-md text-gray-800">Agent is working on your request ...</div>}
    </div>
  );

};

export default Chat;
