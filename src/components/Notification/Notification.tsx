import React, { ReactElement, useEffect, useState } from 'react';
import { getAllNotifications, getAccountNotifications } from '../../services/notification-service';
import EarlyStageService from '../../services/early-stage-service';

import '../../App.css';
import './Notification.css';

export function Notification(): ReactElement {
  useEffect(() => {
    // Retrieve data from localStorage when the component mounts
    // const storedData = LocalStorage.getItem('myDataKey');
    // if (storedData) {
    //     setData(storedData);
    // }
  }, []);

  // const projectNest = "0x24727f6306dac64e1688093c5fec78c5c5668a34";
  // const account = "0x085ce2bf391016c0981db049e96d2aaf2df26365";
  const zeroAddress = "0x0000000000000000000000000000000000000000";

  // Jan-1-2023 0:0:0 +UTC
  const oldTimestamp = 1672531200;

  const [projectNest, setProjectNest] = useState(zeroAddress);
  const [account, setAccount] = useState(zeroAddress);
  const [timestamp, setTimestamp] = useState(oldTimestamp);

  const allNotifications = async () => {
    const notifications = await getAllNotifications(timestamp);
    console.log("all notifications:", notifications);
  };

  const accountNotifications = async () => {
    const notifications = await getAccountNotifications(account);
    console.log("account notifications:", notifications);
  };

  const isAccountInvolved = async () => {
    await EarlyStageService.isAccountInvolved(projectNest, account);
  };

  return (
    <div className="form-container">
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
  );
}
