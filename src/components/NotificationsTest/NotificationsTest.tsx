import React, { ReactElement, useEffect, useRef, useState } from 'react';
import NotificationService from '../../services/notification-service';
import EarlyStageService from '../../services/early-stage-service';

import './NotificationsTest.css';

export function NotificationsTest(): ReactElement {

  // const projectNest = "0x24727f6306dac64e1688093c5fec78c5c5668a34";
  // const account = "0x085ce2bf391016c0981db049e96d2aaf2df26365";
  const zeroAddress = "0x0000000000000000000000000000000000000000";

  // Jan-1-2023 0:0:0 +UTC
  const oldTimestamp = 1672531200;

  const [projectNest, setProjectNest] = useState(zeroAddress);
  const [account, setAccount] = useState(zeroAddress);
  const [timestamp, setTimestamp] = useState(oldTimestamp);

  const allNotifications = async () => {
    log(`Getting all notifications for timestamp ${timestamp}`);
    const notifications = await NotificationService.getAllNotifications(timestamp);
    console.log("all notifications:", notifications);
    log(JSON.stringify(notifications, null, 2));
  };

  const accountNotifications = async () => {
    log(`Getting account notifications for account ${account}`);

    const notifications = await NotificationService.getAccountNotifications(account);
    console.log("account notifications:", notifications);
    log(JSON.stringify(notifications, null, 2));
  };

  const isAccountInvolved = async () => {
    log(`Checking if account ${account} is involved in project nest ${projectNest}`);

    const involved = await EarlyStageService.isAccountInvolved(projectNest, account);
    console.log("isAccountInvolved:", involved);
    log(involved.toString());
  };

  // -- Console log messages --
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const log = (msg) => {
    setMessages(prevMessages => [...prevMessages, msg]);
  };

  // Scroll to the bottom every time messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="form-container">
      <div className="form-content">
        <div className="form-group">
          <label className="label">
            Project Nest
            <input
              value={projectNest}
              onChange={e => setProjectNest(e.target.value)}
              name="projectNest"
              className="input"
            />
          </label>
        </div>

        <div className="form-group">
          <label className="label">
            Account
            <input
              value={account}
              onChange={e => setAccount(e.target.value)}
              name="account"
              className="input"
            />
          </label>
        </div>

        <div className="form-group">
          <label className="label">
            Timestamp
            <input
              value={timestamp}
              type="number"
              onChange={e => setTimestamp(Number(e.target.value))}
              name="timestamp"
              className="input"
            />
          </label>
        </div>

        <div className="button-group">
          <button
            className="button"
            onClick={allNotifications}
          >
            All Notifications
          </button>
        </div>

        <div className="button-group">
          <button
            className="button"
            onClick={accountNotifications}
          >
            Account Notifications
          </button>
        </div>

        <div className="button-group">
          <button
            className="button"
            onClick={isAccountInvolved}
          >
            isAccountInvolvedInNest
          </button>
        </div>
      </div>

      <div className="console">
        {messages.map((msg, index) => (
          <div key={index}>{msg}</div>
        ))}
        {/* Element to scroll to */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
