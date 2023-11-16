import React, { useState, useEffect, useRef } from 'react';
import {
    FlatList,
    Button,
    Text,
    TextInput,
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Keyboard
} from 'react-native';
import axios from 'axios'; // Import axios

// Replace with your actual OpenAI API key and manage it securely
const OPENAI_API_KEY = '';

const Chat = () => {
    const systemMessage = {
        "role": 'system',
        "content": "The assistant is a cognitive behavioral therapist specializing in panic disorder with 20 years of experience. The assistant helps the user get through their panic attacks by reassuring them everything will be okay, helping them talk through catastrophic thoughts, and walking them through exercises that will deescalate the panic attack. Keep responses very concise and brief.",
    };
    const [userInput, setCurrentInput] = useState('');
    const [chatHistory, setMessages] = useState([systemMessage]);
    const flatListRef = useRef();
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            (e) => setKeyboardHeight(e.endCoordinates.height)
        );
        const keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            () => setKeyboardHeight(0)
        );

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    useEffect(() => {
        if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
        }
    }, [chatHistory]);

    const handleSend = async () => {
        const userMessage = {
            "role": 'user',
            "content": userInput,
        };

        setMessages((prevMessages) => [...prevMessages, userMessage]);
        setCurrentInput('');

        const botMessage = await getBotResponse([...chatHistory, userMessage]);
        setMessages((prevMessages) => [...prevMessages, botMessage]);
    };

    const getBotResponse = async (messages) => {
        try {
            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: 'gpt-3.5-turbo',
                    messages: messages,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                "role": 'assistant',
                "content": response.data.choices[0].message.content,
            };

        } catch (error) {
            console.error('Error getting bot response: ', error);
            return {
                "role": 'assistant',
                "content": 'Sorry, I am having trouble understanding that.',
            };
        }
    };

    return (
        <KeyboardAvoidingView 
            style={[styles.container, { paddingBottom: keyboardHeight }]}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={115}
        >
            <FlatList
                ref={flatListRef}
                data={chatHistory}
                keyExtractor={(item, index) => index.toString()}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                renderItem={({ item }) => {
                    // Check if the message role is 'user' and apply the userMessage style
                    if (item.role === 'user') {
                        return (
                            <View style={styles.messageContainer}>
                                <View style={[styles.userMessage, { marginLeft: 'auto' }]}>
                                    <Text>{item.content}</Text>
                                </View>
                            </View>
                        );
                    // Otherwise, assume it's an 'assistant' message and apply the assistantMessage style
                    } else if (item.role === 'assistant') {
                        return (
                            <View style={styles.messageContainer}>
                                <View style={styles.assistantMessage}>
                                    <Text>{item.content}</Text>
                                </View>
                            </View>
                        );
                    } else {
                        // Don't render system messages
                        return null;
                    }
                }}
            />
            <View style={styles.inputAreaContainer}>
                <TextInput
                    style={styles.input}
                    value={userInput}
                    onChangeText={setCurrentInput}
                    placeholder="Type your message here..."
                />
                {/* The Button component in React Native does not accept the style prop.
                    If you want to style the button, consider using a TouchableOpacity or similar. */}
                <Button title='Send' onPress={handleSend} />
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        width: '100%', // Explicitly set the width to be 100% of the screen
    },
    inputAreaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: 'grey',
        padding: 10,
        borderRadius: 5,
        marginRight: 10, // Add space between the input and the send button
    },
    messageContainer: {
        flexDirection: 'row',
        width: '100%',
    },
    userMessage: {
        padding: 10,
        backgroundColor: '#DCF8C6',
        borderRadius: 10,
        marginBottom: 5,
        maxWidth: '80%', // Taking up to 80% of the container width
        // No marginLeft needed since the container itself will fill the screen width
    },
    assistantMessage: {
        padding: 10,
        backgroundColor: '#FFF',
        borderRadius: 10,
        marginBottom: 5,
        maxWidth: '80%', // Taking up to 80% of the container width
        // No marginRight needed for the same reason
    },
});

export default Chat;
