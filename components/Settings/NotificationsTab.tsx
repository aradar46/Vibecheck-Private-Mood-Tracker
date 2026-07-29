import React, { useState, useEffect } from 'react';
import { Bell, Clock, Plus, X as XIcon } from 'lucide-react';
import {
    initializeNotifications,
    scheduleMoodNotifications,
    scheduleMedicationNotification,
} from '../../services/notificationService';
import { getNotificationTimes, saveNotificationTimes } from '../../services/storage';

const NotificationsTab: React.FC = () => {
    const [notificationTimes, setNotificationTimes] = useState<string[]>([]);
    const [newTime, setNewTime] = useState('');
    const [medTimes, setMedTimes] = useState<string[]>([]);
    const [newMedTime, setNewMedTime] = useState('');

    useEffect(() => {
        const load = async () => {
            const times = await getNotificationTimes();
            setNotificationTimes(times);
            const med = localStorage.getItem('medicationTimes') || '';
            setMedTimes(med ? med.split(',') : []);
        };
        load();
    }, []);

    const handleAddTime = async () => {
        if (!newTime) return;
        if (notificationTimes.length >= 6) {
            alert('You can set up to 6 reminders.');
            return;
        }
        if (notificationTimes.includes(newTime)) {
            alert('This time is already set.');
            return;
        }
        const granted = await initializeNotifications();
        if (!granted) {
            alert('Notification permission is required to set reminders.');
            return;
        }
        const updated = [...notificationTimes, newTime].sort();
        setNotificationTimes(updated);
        await saveNotificationTimes(updated);
        await scheduleMoodNotifications(updated);
        setNewTime('');
    };

    const handleDeleteTime = async (time: string) => {
        const updated = notificationTimes.filter((t) => t !== time);
        setNotificationTimes(updated);
        await saveNotificationTimes(updated);
        await scheduleMoodNotifications(updated);
    };

    const handleAddMedTime = async () => {
        if (!newMedTime) return;
        if (medTimes.length >= 6) {
            alert('You can set up to 6 medication reminders.');
            return;
        }
        if (medTimes.includes(newMedTime)) {
            alert('This time is already set.');
            return;
        }
        const granted = await initializeNotifications();
        if (!granted) {
            alert('Notification permission is required.');
            return;
        }
        const updated = [...medTimes, newMedTime].sort();
        setMedTimes(updated);
        localStorage.setItem('medicationTimes', updated.join(','));
        await scheduleMedicationNotification(updated);
        setNewMedTime('');
    };

    const handleDeleteMedTime = async (time: string) => {
        const updated = medTimes.filter((t) => t !== time);
        setMedTimes(updated);
        localStorage.setItem('medicationTimes', updated.join(','));
        await scheduleMedicationNotification(updated);
    };

    return (
        <section className="bg-white dark:bg-navy-surface p-6 rounded-3xl shadow-sm border border-warmGray-light/50 dark:border-navy-border">
            <h3 className="font-bold text-warmGray dark:text-nearWhite mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5" /> Daily Reminders
            </h3>
            <div className="space-y-4">
                <p className="text-sm text-warmGray-medium dark:text-warmGray-light/70">
                    Get notified to check in or take your medication.
                </p>

                {/* Mood reminders */}
                <div>
                    <p className="text-xs font-bold text-brand mb-2">Mood Check-ins</p>
                    <div className="flex gap-2">
                        <input
                            type="time"
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                            className="flex-1 p-3 rounded-xl bg-cream dark:bg-navy border border-transparent dark:border-navy-border text-warmGray dark:text-nearWhite font-bold outline-none"
                        />
                        <button
                            onClick={handleAddTime}
                            className="bg-brand text-brand-text p-3 rounded-xl disabled:opacity-50"
                            disabled={notificationTimes.length >= 6}
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {notificationTimes.length === 0 ? (
                            <p className="text-xs text-warmGray-light italic">No reminders set.</p>
                        ) : (
                            notificationTimes.map((time) => (
                                <div
                                    key={time}
                                    className="flex items-center gap-2 bg-brand-light dark:bg-white/5 px-3 py-2 rounded-xl text-brand font-bold border border-transparent dark:border-navy-border"
                                >
                                    <Clock size={14} />
                                    <span>{time}</span>
                                    <button
                                        onClick={() => handleDeleteTime(time)}
                                        className="text-brand/70 hover:text-brand ml-1"
                                    >
                                        <XIcon size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Medication reminders */}
                <div>
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2">
                        Medication Reminders
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="time"
                            value={newMedTime}
                            onChange={(e) => setNewMedTime(e.target.value)}
                            className="flex-1 p-3 rounded-xl bg-blue-50 dark:bg-navy border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 font-bold outline-none"
                        />
                        <button
                            onClick={handleAddMedTime}
                            className="bg-blue-600 text-white p-3 rounded-xl disabled:opacity-50"
                            disabled={medTimes.length >= 6}
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {medTimes.length === 0 ? (
                            <p className="text-xs text-blue-700/60 italic">No medication reminders set.</p>
                        ) : (
                            medTimes.map((time) => (
                                <div
                                    key={time}
                                    className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 px-3 py-2 rounded-xl text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800"
                                >
                                    <Clock size={14} />
                                    <span>{time}</span>
                                    <button
                                        onClick={() => handleDeleteMedTime(time)}
                                        className="text-blue-700/70 hover:text-blue-900 ml-1"
                                    >
                                        <XIcon size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default NotificationsTab;
