const Tabs = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="flex border-b border-gray-300 mb-12 gap-8">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          className={`p-2 text-sm font-medium uppercase ${
            activeTab === tab.value ? 'text-black border-b-2 border-black' : 'text-gray-500'
          }`}
          onClick={() => onTabChange(tab.value)}
        >
          {tab.label}  {/* Ensure only the label is rendered */}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
