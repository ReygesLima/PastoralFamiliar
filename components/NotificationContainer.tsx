import React from 'react';
import { useNotification } from '../contexts/NotificationContext';
import Notification from './Notification';

const NotificationContainer: React.FC = () => {
    const { notifications, removeNotification } = useNotification();

    return (
        <div className="fixed top-5 right-5 z-50 space-y-3">
            {notifications.map(notification => (
                <Notification
                    key={notification.id}
                    message={notification.message}
                    type={notification.type}
                    onClose={() => removeNotification(notification.id)}
                />
            ))}
        </div>
    );
};

export default NotificationContainer;
