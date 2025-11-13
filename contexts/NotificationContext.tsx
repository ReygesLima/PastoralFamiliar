import React, { createContext, useState, useContext, ReactNode } from 'react';

type NotificationType = 'success' | 'error';

interface Notification {
    id: number;
    message: string;
    type: NotificationType;
}

interface NotificationContextType {
    notifications: Notification[];
    addNotification: (notification: { message: string; type: NotificationType; duration?: number }) => void;
    removeNotification: (id: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = ({ message, type, duration = 5000 }: { message: string; type: NotificationType; duration?: number }) => {
        const id = new Date().getTime();
        setNotifications(prev => [...prev, { id, message, type }]);
        
        setTimeout(() => {
            removeNotification(id);
        }, duration);
    };

    const removeNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
