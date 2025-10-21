import React, { useState } from 'react';
import { BulkItem } from '../types';
import { generateBulkContent } from '../services/geminiService';
import { SparklesIcon, LoaderIcon } from './IconComponents';

interface BulkEditViewProps {
  items: BulkItem[];
  onItemsChange: (items: BulkItem[]) => void;
  children: React.ReactNode;
}

const BulkEditView: React.FC<BulkEditViewProps> = ({
  items,
  onItemsChange,
  children,
}) => {
  const [generatorPrompt, setGeneratorPrompt] = useState<string>('Success and perseverance');
  const [generatorCount, setGeneratorCount] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatorError, setGeneratorError] = useState<string>('');

  const handleAddItem = () => {
    onItemsChange([...items, { id: Date.now().toString(), title: '', body: '' }]);
  };

  const handleRemoveItem = (id: string) => {
    onItemsChange(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: 'title' | 'body', value: string) => {
    onItemsChange(
      items.map(item => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleGenerateScripts = async () => {
    if (!generatorPrompt.trim() || generatorCount <= 0) {
        setGeneratorError('Please provide a prompt and a valid number of scripts to generate.');
        return;
    }
    setIsGenerating(true);
    setGeneratorError('');
    try {
        const newScripts = await generateBulkContent(generatorPrompt, generatorCount);
        const newBulkItems = newScripts.map(script => ({
            id: Date.now().toString() + Math.random(),
            title: script.title,
            body: script.body,
        }));
        onItemsChange(newBulkItems);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred.';
        setGeneratorError(message);
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-gray-200 mb-4">Shared Settings</h3>
        <div className="bg-gray-900/50 rounded-lg p-6">
            {children}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-gray-200 mb-4">AI Bulk Content Generator</h3>
        <div className="bg-gray-900/50 rounded-lg p-6 space-y-4 border border-gray-700">
            <div>
                <label htmlFor="generator-prompt" className="block text-sm font-medium text-gray-300 mb-2">Prompt</label>
                <textarea
                    id="generator-prompt"
                    rows={2}
                    value={generatorPrompt}
                    onChange={(e) => setGeneratorPrompt(e.target.value)}
                    className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5"
                    placeholder="e.g., Short motivational stories about overcoming challenges."
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="sm:col-span-1">
                    <label htmlFor="generator-count" className="block text-sm font-medium text-gray-300 mb-2"># of Scripts</label>
                    <input
                        type="number"
                        id="generator-count"
                        value={generatorCount}
                        onChange={(e) => setGeneratorCount(parseInt(e.target.value))}
                        min="1" max="10"
                        className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5"
                    />
                </div>
                <div className="sm:col-span-2">
                     <button onClick={handleGenerateScripts} disabled={isGenerating} className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-gray-500 disabled:cursor-not-allowed">
                        {isGenerating ? (<><LoaderIcon className="animate-spin -ml-1 mr-2 h-5 w-5" />Generating...</>) : (<><SparklesIcon className="-ml-1 mr-2 h-5 w-5" />Generate Scripts</>)}
                    </button>
                </div>
            </div>
            {generatorError && <p className="mt-2 text-sm text-red-400">{generatorError}</p>}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-gray-200 mb-4">Video Scripts</h3>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 flex items-start space-x-4">
              <span className="text-sky-400 font-bold text-lg mt-2">{index + 1}</span>
              <div className="flex-grow space-y-2">
                <input
                  type="text"
                  value={item.title}
                  onChange={e => handleItemChange(item.id, 'title', e.target.value)}
                  placeholder="Title (optional)"
                  className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5"
                />
                <textarea
                  value={item.body}
                  onChange={e => handleItemChange(item.id, 'body', e.target.value)}
                  placeholder="Body text for the video"
                  rows={3}
                  className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5"
                />
              </div>
              <button
                onClick={() => handleRemoveItem(item.id)}
                className="text-gray-500 hover:text-red-400 transition-colors p-2 mt-1"
                aria-label="Remove item"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={handleAddItem}
          className="mt-4 text-sky-400 hover:text-sky-300 font-medium text-sm"
        >
          + Add another video script
        </button>
      </div>
    </div>
  );
};

export default BulkEditView;
