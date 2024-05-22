import React, { ReactElement, useEffect, useRef, useState } from 'react';

import NotificationService from '../../services/notification-service';
import LocalStorage from '../../services/local-storage';
import EarlyStageService from '../../services/early-stage-service';
import Config, { Network } from '../../services/config';
import './NotificationsTest.css';

// local env
Config.setupConfig({
  NETWORK: Network.FUJI,

  JSON_RPC_URL: "https://api.avax-test.network/ext/bc/C/rpc",
  GRAPH_NOTIFICATIONS_URL: 'https://graph.colonylab.io/subgraphs/name/colony/notifications-fuji-develop',

  EARLYSTAGE_MANAGER_CONTRACT: "0x425C95aB13d2caae4C38c86575fc3EF5Ad7cED4f",
});

const notificationServicePromise = NotificationService.createInstance();

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


  const allNotifications = async () => {
    log(`Getting all notifications for timestamp ${timestamp}`);
    let notificationService = await notificationServicePromise
    const notifications = await notificationService.getRawNotificationsSince(timestamp);
    console.log("all notifications:", notifications);
    log(JSON.stringify(notifications, null, 2));
  };

  const accountNotifications = async () => {
    log(`Getting account notifications for account ${account}`);

    let notificationService = await notificationServicePromise
    const notifications = await notificationService.getAccountNewNotifications(account);
    console.log("account notifications:", notifications);
    log(JSON.stringify(notifications, null, 2));
  };

  const projectExist = async () => {
    log(`EarlyStageService: project: ${projectNest} exist?`);

    const exist = await EarlyStageService.projectExist(projectNest);
    console.log("projectExist:", exist);
    log(exist.toString());
  };

  const isAccountInvolved = async () => {
    log(`EarlyStageService: Account ${account} involved in nest ${projectNest}?`);

    const involved = await EarlyStageService.isAccountInvolved(projectNest, account);
    console.log("isAccountInvolved:", involved);
    log(involved.toString());
  };

  const accountAllocation = async () => {
    log(`EarlyStageService: Account ${account} allocation in nest ${projectNest}?`);

    const allocation = await EarlyStageService.accountAllocation(projectNest, account);
    console.log("allocation:", allocation);
    log(allocation.toString());
  };

  const accountLastNotifications = async () => {
    log(`Getting account last ${limit} notifications for account ${account}`);

    let notificationService = await notificationServicePromise
    const notifications = await notificationService.getAccountLastNotifications(account, limit);
    log(JSON.stringify(notifications, null, 2));
  };

  const accountResetLastNotifications = async () => {
    log(`Resetting account ${account} last notifications`);

    let notificationService = await notificationServicePromise
    await notificationService.resetAccountLastNotifications(account);
    log("Account last notifications reset");
  };

  const setNotificationTimestamp = async () => {
    const now = Math.floor(Date.now() / 1000);
    log(`Setting notification timestamp to ${now} for account ${account}`);

    let notificationService = await notificationServicePromise
    await notificationService.setNotificationTimestamp(account);
    log(`Notification timestamp set to: ${now} for account ${account}`);
  }

  const clearNotifiactionTimestamp = async () => {
    log(`Clearing notification timestamp for account ${account}`);

    await LocalStorage.clearNotificationTimestamp(account);
    log(`Notification timestamp cleared for account ${account}`);
  }

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
            onClick={projectExist}
          >
            ProjectExist
          </button>
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
            Is Account Involved
          </button>
        </div>
        <div className="button-group">
          <button
            className="button"
            onClick={accountAllocation}
          >
            Account Allocation
          </button>
        </div>

        <div className="button-group">
          <button
            className="button"
            onClick={() => accountLastNotifications()}
          >
            Account LastNotifications
          </button>
        </div>

        <div className="button-group">
          <button
            className="button"
            onClick={accountResetLastNotifications}
          >
            Reset Account LastNotifications
          </button>
        </div>

        <div className="button-group">
          <button
            className="button"
            onClick={setNotificationTimestamp}
          >
            Set Notification Timestamp
          </button>
        </div>

        <div className="button-group">
          <button
            className="button"
            onClick={clearNotifiactionTimestamp}
          >
            Clear Notification Timestamp
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
