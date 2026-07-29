import React, { useState } from 'react';
import { Shield, Download, Upload, FileText, Cloud, Trash2 } from 'lucide-react';
import Button from '../Button';
import { clearData } from '../../services/storage';
import { saveAndShareBackup, isGoogleDriveConfigured, getGoogleAuthUrl } from '../../services/driveBackupService';

interface DataTabProps {
    onClearData: () => void;
}

const DataTab: React.FC<DataTabProps> = ({ onClearData }) => {
    const [isExporting, setIsExporting] = useState(false);

    const handleExportJson = async () => {
        setIsExporting(true);
        try {
            await saveAndShareBackup();
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export data. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleGoogleDrive = () => {
        if (isGoogleDriveConfigured()) {
            window.open(getGoogleAuthUrl(), '_blank', 'noopener,noreferrer');
        } else {
            alert('Google Drive backup requires setup. Add your Google OAuth Client ID.');
        }
    };

    const handleClear = async () => {
        if (confirm('Are you sure? This will delete all your mood history and cannot be undone.')) {
            await clearData();
            onClearData();
            window.location.reload();
        }
    };

    return (
        <section className="bg-white dark:bg-navy-surface p-6 rounded-3xl shadow-sm border border-warmGray-light/50 dark:border-navy-border">
            <h3 className="font-bold text-warmGray dark:text-nearWhite mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" /> Data & Privacy
            </h3>

            <div className="space-y-4">
                <div className="p-4 bg-cream dark:bg-navy rounded-xl text-sm text-warmGray dark:text-nearWhite">
                    <p>Your data is stored locally on this device. We don't track you.</p>
                </div>

                {/* Export Data */}
                <button
                    onClick={handleExportJson}
                    disabled={isExporting}
                    className="w-full flex items-center justify-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-sm font-semibold text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors disabled:opacity-50"
                >
                    <Download size={18} /> {isExporting ? 'Exporting...' : 'Export / Share Backup'}
                </button>

                {/* Google Drive */}
                <button
                    onClick={handleGoogleDrive}
                    className="w-full flex items-center justify-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm font-semibold text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                    <Cloud size={18} /> Backup to Google Drive
                </button>

                {/* Import - Coming Soon */}
                <button
                    disabled
                    className="w-full flex items-center justify-start gap-3 p-4 bg-warmGray-light/30 dark:bg-navy border border-warmGray-light/50 dark:border-navy-border rounded-xl text-sm font-semibold text-warmGray-medium dark:text-warmGray-light/70 opacity-60 cursor-not-allowed"
                >
                    <Upload size={18} /> Import Backup (Coming Soon)
                </button>

                {/* PDF Export - Coming Soon */}
                <button
                    disabled
                    className="w-full flex items-center justify-start gap-3 p-4 bg-warmGray-light/30 dark:bg-navy border border-warmGray-light/50 dark:border-navy-border rounded-xl text-sm font-semibold text-warmGray-medium dark:text-warmGray-light/70 opacity-60 cursor-not-allowed"
                >
                    <FileText size={18} /> Export PDF Report (Coming Soon)
                </button>

                {/* Delete All */}
                <Button
                    variant="danger"
                    onClick={handleClear}
                    className="w-full justify-start pl-4"
                    size="md"
                    type="button"
                >
                    <Trash2 size={18} /> Delete All Data
                </Button>
            </div>
        </section>
    );
};

export default DataTab;
