import React, { ReactElement, useEffect, useRef, useState } from 'react';

import NotificationService from '../../services/notification-service';
import GeneralNotifications from '../../services/general-notifications';
import EarlyStageService from '../../services/early-stage-service';
import Config, { Network } from '../../services/config';
import './NotificationsTest.css';

// local env
Config.setupConfig({
  NETWORK: Network.FUJI,

  JSON_RPC_URL: "https://api.avax-test.network/ext/bc/C/rpc",
  GRAPH_NOTIFICATIONS_URL: "https://graph.colonylab.io/subgraphs/name/colony/notifications-fuji-develop",
  GRAPH_EARLYSTAGE_URL: "https://graph.colonylab.io/subgraphs/name/colony/earlystage-fuji-develop",

  EARLYSTAGE_MANAGER_CONTRACT: "0x425C95aB13d2caae4C38c86575fc3EF5Ad7cED4f",
});

export function NotificationsTest(): ReactElement {

  // const projectNest = "0x24727f6306dac64e1688093c5fec78c5c5668a34";
  // const account = "0x085ce2bf391016c0981db049e96d2aaf2df26365";
  const zeroAddress = "0x0000000000000000000000000000000000000000";

  // Jan-1-2023 0:0:0 +UTC
  const oldTimestamp = 1672531200;

  const [projectNest, setProjectNest] = useState(zeroAddress);
  const [account, setAccount] = useState(zeroAddress);
  const [timestamp, setTimestamp] = useState(oldTimestamp);
  const [limit, setLimit] = useState(2);

  const [notificationService, setNotificationService] = useState<NotificationService | null>(null);
  const [generalNotifications, setGeneralNotifications] = useState<GeneralNotifications | null>(null);

  useEffect(() => {
    const initializeServices = async () => {
      try {
        const generalNotifications = await GeneralNotifications.createInstance();
        const notificationService = await NotificationService.createInstance();

        setGeneralNotifications(generalNotifications);
        setNotificationService(notificationService);
        log("Services initialized");
      } catch (error) {
        console.error("Error initializing services:", error);
      }
    };

    initializeServices();
  }, []);

  const allNotifications = async () => {
    log(`Getting all notifications for timestamp ${timestamp}`);
    const notifications = await generalNotifications.getNotificationsSince(timestamp);
    console.log("all notifications:", notifications);
    log(JSON.stringify(notifications, null, 2));
  };

  const isAccountInvolved = async () => {
    log(`EarlyStageService: Account ${account} involved in nest ${projectNest}?`);

    const involved = EarlyStageService.isAccountInvolved(projectNest, account);
    console.log("is account involved:", involved);
    log(involved.toString());
  };

  const accountNextNotifications = async () => {
    try {
      log(`Getting ${limit} next notifications for account ${account}`);

      const notifications = await notificationService.getNextNotifications(account, limit);
      log(JSON.stringify(notifications, null, 2));
    } catch (error) {
      log(`Caught error: ${error.message}`);
    }
  };

  const accountResetNextNotifications = async () => {
    try {
      log(`Resetting account ${account} next notifications`);

      await notificationService.resetNextNotifications(account);
      log("Account last notifications reset");
    } catch (error) {
      log(`Caught error: ${error.message}`);
    }
  };

  const unreadNotificationsNumber = async () => {
    try {
      log(`Getting unreadNotifications ${account} notifications count`);

      const count = await notificationService.unreadNotificationsNumber(account);
      log(`Unread: ${count.toString()}`);
    } catch (error) {
      log(`Caught error: ${error.message}`);
    }
  };

  const syncAccountNotifications = async () => {
    try {
      log(`Syncing notifications for account ${account}`);

      const result = await notificationService.syncAccountNotifications(account);
      console.log("account sync:", result);
      log(result.toString());
    } catch (error) {
      log(`Caught error: ${error.message}`);
    }
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
            Number of Notifications (limit)
            <input
              value={limit}
              type="number"
              onChange={e => setLimit(Number(e.target.value))}
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
            onClick={isAccountInvolved}
          >
            Is Involved
          </button>
        </div>

        <div className="button-group">
          <button
            className="button"
            onClick={() => accountNextNotifications()}
          >
            Next Notifications
          </button>
        </div>

        <div className="button-group">
          <button
            className="button"
            onClick={accountResetNextNotifications}
          >
            Reset Next Notifications
          </button>
        </div>

        <div className="button-group">
          <button
            className="button"
            onClick={unreadNotificationsNumber}
          >
            Unread Notifications Number
          </button>
        </div>

        <div className="button-group">
          <button
            className="button"
            onClick={syncAccountNotifications}
          >
            Sync Account Notifications
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
