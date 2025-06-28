import React, { useState, useRef } from 'react';
import { SlateEditor } from './components/SlateEditor';
import { ChatInterface } from './components/ChatInterface';
import { ToastContainer } from './components/Toast';
import { PasswordProtection } from './components/PasswordProtection';
import { useDocument } from './hooks/useDocument';
import { useChat } from './hooks/useChat';
import { useToast } from './hooks/useToast';
import { useAuth } from './hooks/useAuth';
import { extractPlainText, SuggestedChanges } from './types';
import { MessageSquare, X, LogOut } from 'lucide-react';

const INITIAL_CONTENT = `<h1>Welcome to Your Document Chat Assistant</h1>

<p>This is your intelligent rich text editor that works alongside an AI assistant. Here's how to get started:</p>

<h2>Getting Started</h2>
<ol>
  <li><strong>Edit this document</strong> - Add your own content, modify existing text, or start fresh</li>
  <li><strong>Use rich formatting</strong> - Bold, italic, headers, lists, and more</li>
  <li><strong>Paste from Word</strong> - Copy content from Word, Google Docs, or any rich text editor</li>
  <li><strong>Select text</strong> - Highlight any portion of your document to provide context to the AI</li>
  <li><strong>Chat with AI</strong> - Ask questions, request edits, or get suggestions about your content</li>
</ol>

<h2>Features</h2>
<ul>
  <li><strong>Rich Text Editing</strong>: Full formatting support with professional toolbar</li>
  <li><strong>Word Compatibility</strong>: Paste directly from Microsoft Word or Google Docs</li>
  <li><strong>Smart Context</strong>: The AI understands your selected text and full document</li>
  <li><strong>Real-time Editing</strong>: Get suggestions and apply changes seamlessly</li>
  <li><strong>Intelligent Assistance</strong>: Ask for help with writing, editing, formatting, and more</li>
</ul>

<h2>Sample Business Proposal</h2>
<blockquote>
  <p><strong>Executive Summary:</strong> Our innovative solution addresses the growing need for efficient document collaboration in remote work environments. By combining AI-powered assistance with intuitive editing tools, we enable teams to create professional documents faster than ever before.</p>
</blockquote>

<p>The market opportunity is significant, with over <strong>2.7 billion knowledge workers</strong> worldwide who regularly create and edit documents. Our target customers include:</p>

<ul>
  <li>Marketing teams creating campaign materials</li>
  <li>Legal professionals drafting contracts</li>
  <li>Consultants preparing client reports</li>
  <li>Academic researchers writing papers</li>
</ul>

<h2>Technical Implementation</h2>
<p>Our platform leverages cutting-edge technologies:</p>

<ol>
  <li><em>Natural Language Processing</em> for context understanding</li>
  <li><em>Machine Learning</em> for personalized suggestions</li>
  <li><em>Cloud Infrastructure</em> for seamless collaboration</li>
  <li><em>Advanced Security</em> for enterprise-grade protection</li>
</ol>

<p><strong>Try selecting some text in this document and asking the AI assistant for help!</strong> You can ask questions like:</p>

<blockquote>
  <p>"Can you improve the grammar in this paragraph?"</p>
  <p>"Make this section more professional"</p>
  <p>"Suggest a better introduction"</p>
  <p>"Help me expand on this idea"</p>
  <p>"Convert this to a bulleted list"</p>
</blockquote>

<p><em>The AI assistant is ready to help you create, edit, and improve your documents with intelligent suggestions and real-time feedback.</em></p>`;

function App() {
  const { isAuthenticated, isLoading, authenticate, logout } = useAuth();
  const document = useDocument(INITIAL_CONTENT);
  const chat = useChat();
  const toast = useToast();
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  
  // Create a ref to store the editor's replace function
  const editorReplaceRef = useRef<((newHtml: string) => void) | null>(null);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center relative">
        {/* Background with sunset gradient fallback */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600"
          style={{
            backgroundImage: 'url(/images/bg.jpg), linear-gradient(135deg, #fb923c 0%, #ec4899 50%, #9333ea 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'blur(8px)',
            transform: 'scale(1.1)' // Slightly scale to avoid blur edge artifacts
          }}
        />
        
        {/* Content overlay */}
        <div className="relative z-10 text-center bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show password protection if not authenticated
  if (!isAuthenticated) {
    return <PasswordProtection onAuthenticated={authenticate} />;
  }

  const handleSendMessage = (message: string) => {
    // Pass the raw HTML selectedText to maintain formatting context
    chat.sendMessage(message, document.content, document.selection?.text);
  };

  const handleApplyChanges = async (suggestedChanges: SuggestedChanges, messageId: string) => {
    try {
      console.log('🚀 App: Applying AI changes using working method');
      
      const updatedDocument = await chat.applyChanges(suggestedChanges, document.content, messageId);
      
      console.log('📝 App: Got updated document from AI:', {
        updatedLength: updatedDocument.length,
        updatedPreview: updatedDocument.substring(0, 200) + '...'
      });
      
      // Use the editor's direct replacement method instead of going through document state
      if (editorReplaceRef.current) {
        console.log('✅ App: Using editor direct replacement method');
        editorReplaceRef.current(updatedDocument);
      } else {
        console.log('⚠️ App: Editor replace method not available, falling back to document state');
        document.forceUpdateContent(updatedDocument);
      }
      
      toast.showSuccess('Changes applied successfully!');
    } catch (error) {
      console.error('Failed to apply changes:', error);
      toast.showError('Failed to apply changes. Please try again.');
    }
  };

  // Callback to receive the editor's replace function
  const handleEditorReplaceRef = (replaceFunction: (newHtml: string) => void) => {
    editorReplaceRef.current = replaceFunction;
  };

  const toggleMobileChat = () => {
    setIsMobileChatOpen(!isMobileChatOpen);
  };

  const handleLogout = () => {
    logout();
    // Clear any sensitive data
    chat.clearMessages();
    document.forceUpdateContent(INITIAL_CONTENT);
    toast.showSuccess('Logged out successfully');
  };

  return (
    <div className="h-screen flex relative">
      {/* Background with sunset gradient fallback */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600"
        style={{
          backgroundImage: 'url(/images/bg.jpg), linear-gradient(135deg, #fb923c 0%, #ec4899 50%, #9333ea 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'blur(8px)',
          transform: 'scale(1.1)' // Slightly scale to avoid blur edge artifacts
        }}
      />
      
      {/* Content overlay */}
      <div className="relative z-10 w-full">
        {/* Toast Container */}
        <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />

        {/* Main Content Container with Max Width */}
        <div className="w-full max-w-[1800px] mx-auto flex bg-white/95 backdrop-blur-sm shadow-xl rounded-lg m-4 overflow-hidden h-[calc(100vh-2rem)]">
          {/* Slate Editor - Takes up 2/3 on desktop, full width on mobile */}
          <div className={`bg-white shadow-sm border-r border-gray-200 overflow-hidden transition-opacity duration-200 ${
            isMobileChatOpen ? 'lg:flex-[2] opacity-30 lg:opacity-100' : 'lg:flex-[2] flex-1'
          }`}>
            <SlateEditor
              content={document.content}
              selection={document.selection}
              onContentChange={document.updateContent}
              onSelectionChange={document.updateSelection}
              hasSelection={!!document.selection}
              onToggleMobileChat={toggleMobileChat}
              selectedText={document.selection?.text ? extractPlainText(document.selection.text) : undefined}
              onReplaceContent={handleEditorReplaceRef}
            />
          </div>

          {/* Desktop Chat Interface - Takes up 1/3 max */}
          <div className="hidden lg:flex lg:flex-col lg:flex-1 lg:max-w-md bg-white shadow-sm">
            {/* Chat Header with Logout */}
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-gray-600" />
                <h2 className="font-semibold text-gray-800">AI Assistant</h2>
              </div>
              <div className="flex items-center space-x-2">
                {document.selection?.text && (
                  <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full border border-blue-200">
                    Text selected
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Chat Interface - Takes remaining height */}
            <div className="flex-1 min-h-0">
              <ChatInterface
                messages={chat.messages}
                isLoading={chat.isLoading}
                error={chat.error}
                selectedText={document.selection?.text ? extractPlainText(document.selection.text) : undefined}
                onSendMessage={handleSendMessage}
                onApplyChanges={handleApplyChanges}
                onClearMessages={chat.clearMessages}
                onClearError={chat.clearError}
              />
            </div>
          </div>
        </div>

        {/* Mobile Chat Popover */}
        {isMobileChatOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex items-end">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={toggleMobileChat}
            />
            
            {/* Popover */}
            <div className="relative w-full bg-white rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col mobile-popover">
              {/* Popover Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-gray-600" />
                  <h2 className="font-semibold text-gray-800">AI Assistant</h2>
                  {document.selection?.text && (
                    <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full border border-blue-200">
                      Text selected
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleLogout}
                    className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={toggleMobileChat}
                    className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Chat Content - Takes remaining height */}
              <div className="flex-1 min-h-0">
                <ChatInterface
                  messages={chat.messages}
                  isLoading={chat.isLoading}
                  error={chat.error}
                  selectedText={document.selection?.text ? extractPlainText(document.selection.text) : undefined}
                  onSendMessage={handleSendMessage}
                  onApplyChanges={handleApplyChanges}
                  onClearMessages={chat.clearMessages}
                  onClearError={chat.clearError}
                  isMobile={true}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;