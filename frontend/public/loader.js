(function () {
    const scriptTag = document.currentScript;
    const companyId = scriptTag.getAttribute('data-company-id');
    const baseUrl = scriptTag.getAttribute('data-base-url') || 'https://prime-chatbot-frontend.onrender.com';

    if (!companyId) {
        console.error('Prime Chatbot: data-company-id attribute is required.');
        return;
    }

    // Styles
    const style = document.createElement('style');
    style.innerHTML = `
        .prime-chat-widget-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .prime-chat-button {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background-color: #000;
            color: #fff;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s;
        }
        .prime-chat-button:hover {
            transform: scale(1.05);
        }
        .prime-chat-iframe-container {
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: 380px;
            height: 600px;
            max-height: 80vh;
            background: white;
            border-radius: 12px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            overflow: hidden;
            display: none;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        .prime-chat-iframe-container.open {
            display: block;
            opacity: 1;
        }
        .prime-chat-iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
        @media (max-width: 480px) {
            .prime-chat-iframe-container {
                width: 90%;
                right: 5%;
                bottom: 80px;
            }
        }
    `;
    document.head.appendChild(style);

    // Container
    const container = document.createElement('div');
    container.className = 'prime-chat-widget-container';

    // Iframe Container
    const iframeContainer = document.createElement('div');
    iframeContainer.className = 'prime-chat-iframe-container';

    const iframe = document.createElement('iframe');
    iframe.src = `${baseUrl}/embed/${companyId}`;
    iframe.className = 'prime-chat-iframe';
    iframeContainer.appendChild(iframe);

    // Button
    const button = document.createElement('button');
    button.className = 'prime-chat-button';
    button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
    `;

    // Toggle Logic
    let isOpen = false;
    button.onclick = () => {
        isOpen = !isOpen;
        if (isOpen) {
            iframeContainer.classList.add('open');
            button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            `;
        } else {
            iframeContainer.classList.remove('open');
            button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
            `;
        }
    };

    container.appendChild(button);
    document.body.appendChild(iframeContainer);
    document.body.appendChild(container);

})();
