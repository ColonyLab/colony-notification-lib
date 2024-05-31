import React, { useEffect, useRef, useState } from 'react';

import GraphService from '../../services/graph-service';
import GeneralNotifications from '../../services/general-notifications';
import NotificationStream from '../../services/notification-stream';
import NotificationService from '../../services/notification-service';
import Config, { Network } from '../../services/config';
import './NotificationsTest.css';

// local env
Config.setupConfig({
  NETWORK: Network.FUJI,

  JSON_RPC_URL: "https://api.avax-test.network/ext/bc/C/rpc",
  GRAPH_NOTIFICATIONS_URL: "https://graph.colonylab.io/subgraphs/name/colony/notifications-fuji-develop",
  GRAPH_EARLYSTAGE_URL: "https://graph.colonylab.io/subgraphs/name/colony/earlystage-fuji-develop",
  GRAPH_STAKING_V3_URL: "https://graph.colonylab.io/subgraphs/name/colony/stakingV3-fuji-develop",

  EARLYSTAGE_MANAGER_CONTRACT: "0x425C95aB13d2caae4C38c86575fc3EF5Ad7cED4f",
});

export function NotificationsTest(): React.FC {
  const defaultPageSize = 4;

  // const projectNest = "0x24727f6306dac64e1688093c5fec78c5c5668a34";
  const defaultAccount = "0x085cE2bF391016c0981DB049E96D2aAF2dF26365";
  const zeroAddress = "0x0000000000000000000000000000000000000000";

  // Jan-1-2023 0:0:0 +UTC
  const oldTimestamp = 1672531200;

  const [projectNest, setProjectNest] = useState(zeroAddress);
  const [account, setAccount] = useState(defaultAccount);
  const [timestamp, setTimestamp] = useState(oldTimestamp);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const [generalNotifications, setGeneralNotifications] = useState<GeneralNotifications | null>(null);
  const [notificationService, setNotificationService] = useState<NotificationService | null>(null);
  const [notificationStream, setNotificationStream] = useState<NotificationStream | null>(null);

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

  useEffect(() => {
    const setupNotificationStream = async () => {
      if (notificationService) {
        const stream = await notificationService.createStream(account, (notifications) => {
          console.log(`Notification Stream for account ${account}:`);
          log(JSON.stringify(notifications, null, 2));
        }, {
          pageSize,
        });

        setNotificationStream(stream);

        console.log("Notification stream set up");
      }
    };

    setupNotificationStream();
  }, [account, pageSize, notificationService]);

  const allNotifications = () => {
    log(`Getting all notifications for timestamp ${timestamp}`);
    const notifications = generalNotifications.getNotificationsSince(timestamp);
    console.log("all notifications:", notifications);
    log(JSON.stringify(notifications, null, 2));
  };

  const isAccountInvolved = async () => {
    log(`GraphService: Account ${account} involved in nest ${projectNest}?`);

    await GraphService.fetchAccountNests(account);
    const involved = GraphService.isAccountInvolved(projectNest, account);
    console.log("is account involved:", involved);
    log(involved.toString());
  };

  const accountFirstStake = async () => {
    log(`GraphService: Account ${account} first stake`);

    let firstStake: number | string = await GraphService.fetchAccountFirstStakeTimestamp(account);
    if (firstStake === null) {
      firstStake = "null";
    }
    console.log("first stake timestamp:", firstStake);
    log(firstStake.toString());
  };

  const handleLoadMore = () => {
    log(`Loading more notifications for account ${account}`);
    if (notificationStream) {
      notificationStream.loadMore();
    }
  };

  const handleReset = () => {
    log(`Resetting notification stream for account ${account}, pageSize: ${pageSize}`);
    log(`Loading more notifications for account ${account}`);
    if (notificationStream) {
      notificationStream.reset(pageSize);
    }
  };

  const accountNotificationsLenght = () => {
    try {
      log(`Total ${account} notifications length`);
      const len = notificationStream.getNotificationsLength();

      log("Account notifications length: " + len.toString());
    } catch (error) {
      log(`Caught error: ${error.message}`);
    }
  };

  const markAccountNotificationsAsRead = async () => {
    try {
      log(`Marking account ${account} notification with timestamp ${timestamp} as read`);

      notificationStream.markNotificationAsRead(timestamp);
      log("Account notification marked as read");
    } catch (error) {
      log(`Caught error: ${error.message}`);
    }
  };

  const markAllAccountNotificationsAsRead = async () => {
    try {
      log(`Marking all account ${account} notifications as read`);

      notificationStream.markAllNotificationsAsRead();
      log("All account notifications marked as read");
    } catch (error) {
      log(`Caught error: ${error.message}`);
    }
  };

  const unreadNotificationsNumber = async () => {
    try {
      log(`Getting unreadNotifications ${account} notifications count`);

      const count = notificationStream.unreadNotificationsNumber;
      log(`Unread: ${count.toString()}`);
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
            Notifications Page Size
            <input
              value={pageSize}
              type="number"
              onChange={e => setPageSize(Number(e.target.value))}
              name="limit"
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
            onClick={accountFirstStake}
          >
            Account First Stake
          </button>
        </div>

        <div className="button-group">
          <button
            className="button"
            onClick={handleLoadMore}
          >
            Load More Account Notifications
          </button>
        </div>

        <div className="button-group">
          <button
            className="button"
            onClick={handleReset}
          >
            Reset Account Notification Stream
          </button>
        </div>

        <div className="button-group">
          <button
            className="button"
            onClick={accountNotificationsLenght}
          >
            Get Account Notifications Length
          </button>
        </div>

        <div className="button-group">
          <button
            className="button"
            onClick={markAccountNotificationsAsRead}
          >
            Mark As Read (timestamp)
          </button>
        </div>

        <div className="button-group">
          <button
            className="button"
            onClick={markAllAccountNotificationsAsRead}
          >
            Mark All Notifications As Read
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
