import { useState, useEffect } from 'react';
import Input from './ui/Input';
import TextArea from './ui/TextArea';
import FilledButton from './ui/FilledButton';
import PlainButton from './ui/PlainButton';
import ErrorBlock from './ui/ErrorBlock';

const AgentInfo = ({ agentData, isEditMode, onSave, toggleEditMode, error, onReturn }) => {
  const [localData, setLocalData] = useState({ ...agentData });

  useEffect(() => {
    setLocalData({ ...agentData });
  }, [agentData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handlePromptChange = (index, value) => {
    setLocalData((prevData) => {
      // Create a shallow copy of the existing prompts
      const updatedPrompts = [...prevData.suggested_prompts];

      // Update the specific prompt at the given index
      updatedPrompts[index] = value;

      // Filter out any empty prompts at the end of the array
      const filteredPrompts = updatedPrompts.filter((prompt, i) => prompt.trim() !== '' || i < index);

      // Ensure that there are always 3 elements in the array, padding with empty strings if necessary
      while (filteredPrompts.length < 3) {
        filteredPrompts.push('');
      }

      return {
        ...prevData,
        suggested_prompts: filteredPrompts,
      };
    });
  };

  const handleSave = () => {
    const dataToSend = {
      ...localData,
      suggested_prompts: localData.suggested_prompts.filter(prompt => prompt.trim() !== '')
    };
    onSave(dataToSend);
  };

  const handleCancel = () => {
    setLocalData({ ...agentData }); // Reset local data to the original agent data
    toggleEditMode(); // Exit edit mode
  };

  const handleReturn = () => {
    onReturn()
  }

  return (
    <div>
      <Input
        id="name"
        name="name"
        value={localData.name || ''}
        onChange={handleChange}
        placeholder="Name"
        disabled={!!agentData.name || !isEditMode}
        autoComplete="off"
      />
      <TextArea
        id="instructions"
        name="instructions"
        value={localData.instructions || ''}
        onChange={handleChange}
        placeholder="Instructions"
        disabled={!isEditMode}
        autoComplete="off"
      />
      <Input
        id="welcome_message"
        name="welcome_message"
        value={localData.welcome_message || ''}
        onChange={handleChange}
        placeholder="Welcome Message"
        disabled={!isEditMode}
        autoComplete="off"
      />

      <div className="relative mt-8 border border-gray-300 rounded-md p-6">
        <label className="absolute left-4 -top-3 bg-white px-1 text-xs text-gray-500">
          Suggested Prompts
        </label>
        <div className="space-y-4 mt-4">
          {localData.suggested_prompts.map((prompt, index) => (
            <div key={index} className="flex items-start space-x-2">
              <div className="text-gray-500">{index + 1}.</div>
              <div className="flex-1">
                <Input
                  id={`prompt_${index+1}`}
                  value={prompt}
                  onChange={(e) => handlePromptChange(index, e.target.value)}
                  placeholder={`Prompt ${index + 1}`}
                  disabled={!isEditMode}
                  autoComplete="off"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center mt-8">
        <div className="flex items-center">
          {error && <ErrorBlock>{error}</ErrorBlock>}
        </div>
        <div className="flex space-x-4 items-center">
          {!isEditMode ? (
            <FilledButton onClick={toggleEditMode}>Edit</FilledButton>
          ) : (
            <>
              {!agentData && <PlainButton onClick={handleReturn}>Return to Agents</PlainButton>}
              {agentData && <PlainButton onClick={handleCancel}>Cancel</PlainButton>}
              <FilledButton onClick={handleSave}>Save</FilledButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
};




export default AgentInfo;
