import React, { useState } from 'react';
import { Mic, StopCircle, ChevronDown } from 'lucide-react';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

interface NoteInputProps {
    note: string;
    onNoteChange: (note: string) => void;
}

const NoteInput: React.FC<NoteInputProps> = ({ note, onNoteChange }) => {
    const [showQuickNote, setShowQuickNote] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    const toggleRecording = async () => {
        if (isRecording) {
            try {
                await SpeechRecognition.stop();
                setIsRecording(false);
            } catch (err) {
                console.error('Error stopping speech recognition', err);
                setIsRecording(false);
            }
        } else {
            try {
                const { available } = await SpeechRecognition.available();
                if (!available) {
                    alert('Voice dictation is not available on this device.');
                    return;
                }

                const permission = await SpeechRecognition.requestPermissions();
                if (permission.speechRecognition !== 'granted') {
                    alert('Microphone permission is required for voice notes.');
                    return;
                }

                setIsRecording(true);

                const result = await SpeechRecognition.start({
                    language: 'en-US',
                    maxResults: 5,
                    prompt: 'Speak your thoughts...',
                    partialResults: true,
                    popup: true,
                });

                if (result && result.matches && result.matches.length > 0) {
                    const transcript = result.matches[0];
                    onNoteChange(note + (note.length > 0 && !note.endsWith(' ') ? ' ' : '') + transcript);
                }

                setIsRecording(false);
            } catch (err: any) {
                console.error('Speech recognition error', err);
                if (err.message && !err.message.includes('cancelled')) {
                    alert('Failed to start voice recording. Please check microphone permissions.');
                }
                setIsRecording(false);
            }
        }
    };

    return (
        <section>
            <button
                onClick={() => setShowQuickNote(!showQuickNote)}
                className="w-full flex items-center justify-between hover:opacity-80 transition-opacity mb-2"
            >
                <h3 className="text-xs font-bold uppercase text-warmGray-medium dark:text-warmGray-light/70 tracking-wider">
                    Note?
                </h3>
                <ChevronDown
                    size={14}
                    className={`text-warmGray-medium transition-transform ${showQuickNote ? 'rotate-180' : ''}`}
                />
            </button>

            {showQuickNote && (
                <div className="relative animate-in slide-in-from-top-2">
                    <textarea
                        value={note}
                        onChange={(e) => onNoteChange(e.target.value)}
                        placeholder="Brain dump here..."
                        className={`w-full p-3 rounded-2xl bg-brand-light dark:bg-navy-surface border-2 border-transparent dark:border-navy-border focus:border-brand focus:ring-0 resize-none h-24 text-sm text-warmGray dark:text-nearWhite transition-colors ${isRecording ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : ''
                            }`}
                    />
                    <button
                        onClick={toggleRecording}
                        className={`absolute bottom-4 right-4 p-3 rounded-full transition-all duration-200 shadow-sm ${isRecording
                                ? 'bg-red-500 text-white animate-pulse scale-110 shadow-red-300'
                                : 'bg-cream dark:bg-navy text-warmGray-medium dark:text-warmGray-light hover:text-brand hover:bg-brand-light'
                            }`}
                        title="Voice Note"
                    >
                        {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
                    </button>
                </div>
            )}
            {isRecording && (
                <p className="text-xs text-red-500 font-bold mt-2 ml-1 animate-pulse">
                    Recording... speak clearly
                </p>
            )}
        </section>
    );
};

export default NoteInput;
