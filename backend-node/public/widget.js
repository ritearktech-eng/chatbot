(function () {
    const script = document.currentScript;
    const companyId = script.getAttribute('data-company-id');
    const API_URL = 'http://localhost:3000'; // Should be config

    if (!companyId) {
        console.error('Prime Chatbot: No company ID provided');
        return;
    }

    // Create Styles
    const style = document.createElement('style');
    style.innerHTML = `
    .prime-chat-widget {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      font-family: sans-serif;
    }
    .prime-chat-button {
      width: 60px;
      height: 60px;
      border-radius: 30px;
      background-color: #000;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: transform 0.2s;
    }
    .prime-chat-button:hover {
      transform: scale(1.05);
    }
    .prime-chat-window {
      position: fixed;
      bottom: 100px;
      right: 20px;
      width: 350px;
      height: 500px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 5px 20px rgba(0,0,0,0.15);
      display: none;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid #eee;
    }
    .prime-chat-header {
      padding: 15px;
      background: #000;
      color: #fff;
      font-weight: bold;
      display: flex;
      justify-content: space-between;
    }
    .prime-chat-messages {
      flex: 1;
      padding: 15px;
      overflow-y: auto;
      background: #f9f9f9;
    }
    .prime-chat-input-area {
      padding: 15px;
      border-top: 1px solid #eee;
      display: flex;
    }
    .prime-chat-input {
      flex: 1;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      outline: none;
    }
    .prime-chat-send {
      margin-left: 8px;
      padding: 8px 15px;
      background: #000;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .msg {
      margin-bottom: 10px;
      max-width: 80%;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 14px;
      line-height: 1.4;
    }
    .msg.user {
      background: #000;
      color: #fff;
      margin-left: auto;
    }
    .msg.bot {
      background: #e9e9e9;
      color: #000;
    }
  `;
    document.head.appendChild(style);

    // Create Container
    const container = document.createElement('div');
    container.className = 'prime-chat-widget';

    // Create Button
    const button = document.createElement('div');
    button.className = 'prime-chat-button';
    button.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';

    // Create Window
    const windowDiv = document.createElement('div');
    windowDiv.className = 'prime-chat-window';
    windowDiv.innerHTML = `
    <div class="prime-chat-header">
      <span>Chat Support</span>
      <span style="cursor:pointer" id="close-chat">×</span>
    </div>
    <div class="prime-chat-messages" id="prime-messages">
      <div class="msg bot">Hello! How can I help you?</div>
    </div>
    <div class="prime-chat-input-area">
      <input type="text" class="prime-chat-input" placeholder="Type a message..." />
      <button class="prime-chat-send">Send</button>
    </div>
  `;

    container.appendChild(windowDiv);
    container.appendChild(button);
    document.body.appendChild(container);

    // Logic
    const msgsDiv = windowDiv.querySelector('#prime-messages');
    const input = windowDiv.querySelector('input');
    const sendBtn = windowDiv.querySelector('.prime-chat-send');
    const closeBtn = windowDiv.querySelector('#close-chat');

    let isOpen = false;
    button.onclick = () => {
        isOpen = !isOpen;
        windowDiv.style.display = isOpen ? 'flex' : 'none';
    };
    closeBtn.onclick = () => {
        isOpen = false;
        windowDiv.style.display = 'none';
    };

    const addMessage = (text, type) => {
        const div = document.createElement('div');
        div.className = `msg ${type}`;
        div.textContent = text;
        msgsDiv.appendChild(div);
        msgsDiv.scrollTop = msgsDiv.scrollHeight;
    };

    const sendMessage = async () => {
        const text = input.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        input.value = '';

        try {
            const res = await fetch(`${API_URL}/chat/${companyId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: text, history: [] })
            });
            const data = await res.json();
            addMessage(data.answer, 'bot');
        } catch (err) {
            addMessage('Sorry, something went wrong.', 'bot');
        }
    };

    sendBtn.onclick = sendMessage;
    input.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };

})();
