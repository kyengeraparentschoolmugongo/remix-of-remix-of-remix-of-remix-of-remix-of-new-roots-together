import { useEffect, useRef, useState } from 'react';
const adminPhoto = { url: '/__l5e/assets-v1/fa5f872e-e4bd-44d1-bca7-8dead5e12669/51de6e3f-admin-photo.webp' };
import { legacyGreeting } from '@/lib/legacy-pages';
import styles from '@/styles/whatsapp-chat.css?raw';

// One shared WhatsApp chat for the whole app: the captured homepage widget,
// mounted by LibraryShell so every page shows the same button and dialog.
export function WhatsAppChat() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [greeting, setGreeting] = useState('');
  const trigger = useRef<HTMLAnchorElement>(null);
  useEffect(() => { setGreeting(legacyGreeting(new Date().getHours())); }, []);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !open) return;
      setOpen(false);
      trigger.current?.focus();
    };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [open]);
  const icon = greeting.includes('morning') ? ['sun', '#f59e0b'] : greeting.includes('afternoon') ? ['cloud-sun', '#fb923c'] : ['moon', '#818cf8'];
  return <div className="whatsapp-chat">
    <style>{styles}</style>
    <div id="africavotes-chat" className={open ? 'show' : 'hide'} role="dialog" aria-label="Chat with Fresh Teacher">
      <div className="header-chat">
        <div className="head-home">
          <div className="info-avatar">
            <img src={adminPhoto.url} alt="" />
          </div>
          <p>
            <span className="africavotes-name">Fresh Teacher</span>
            <br />
            <small>online </small>
          </p>
        </div>
        <div className="get-new hide">
          <div id="get-label" />
          <div id="get-nama" />
        </div>
      </div>
      <div className="home-chat" />
      <div className="start-chat">
        <div className="africavotes-chat-body">
          <div className="dAbFpq">
            <div className="eJJEeC" style={{ opacity: '0' }}>
              <div className="hFENyl">
                <div className="ixsrax" />
                <div className="dRvxoz" />
                <div className="kXBtNt" />
              </div>
            </div>
            <div className="kAZgZq" style={{ opacity: '1' }}>
              <div className="iSpIQi" id="greeting">{greeting}{greeting && <> <i className={`fa-solid fa-${icon[0]}`} style={{ color: icon[1] }} aria-hidden="true" /></>}</div>
            </div>
          </div>
        </div>
        <div className="blanter-msg">
          <textarea id="chat-input" maxLength={120} placeholder="Message" aria-label="Message" value={message} onChange={event => setMessage(event.target.value)} />
          <a id="send-it" href={message.trim() ? `https://web.whatsapp.com/send?phone=+256750687790&text=${encodeURIComponent(message)}` : '#'} target="_blank" rel="noopener noreferrer" role="button" aria-label="Send message on WhatsApp" onClick={event => { if (!message.trim()) event.preventDefault(); }}>
            <svg viewBox="0 0 448 448"><path d="M.213 32L0 181.333 320 224 0 266.667.213 416 448 224z" /></svg>
          </a>
        </div>
      </div>
      <div id="get-number" />
      <a className="close-chat" href="#" role="button" aria-label="Close chat" onClick={event => { event.preventDefault(); setOpen(false); trigger.current?.focus(); }}>×</a>
    </div>
    <a className="africaVotesChat" title="WhatsApp" href="#" role="button" aria-label="Show Chat" aria-expanded={open} ref={trigger} onClick={event => { event.preventDefault(); setOpen(value => !value); }}>
      <svg width="26" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#eceff1" d="M20.5 3.4A12.1 12.1 0 0012 0 12 12 0 001.7 17.8L0 24l6.3-1.7c2.8 1.5 5 1.4 5.8 1.5a12 12 0 008.4-20.3z" />
        <path fill="#4caf50" d="M12 21.8c-3.1 0-5.2-1.6-5.4-1.6l-3.7 1 1-3.7-.3-.4A9.9 9.9 0 012.1 12a10 10 0 0117-7 9.9 9.9 0 01-7 16.9z" />
        <path fill="#fafafa" d="M17.5 14.3c-.3 0-1.8-.8-2-.9-.7-.2-.5 0-1.7 1.3-.1.2-.3.2-.6.1s-1.3-.5-2.4-1.5a9 9 0 01-1.7-2c-.3-.6.4-.6 1-1.7l-.1-.5-1-2.2c-.2-.6-.4-.5-.6-.5-.6 0-1 0-1.4.3-1.6 1.8-1.2 3.6.2 5.6 2.7 3.5 4.2 4.2 6.8 5 .7.3 1.4.3 1.9.2.6 0 1.7-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.3-.6-.4z" />
      </svg>
    </a>
  </div>;
}
