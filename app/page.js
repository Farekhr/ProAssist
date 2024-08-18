'use client';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { AppBar, Toolbar, Button, Typography, Box, Stack, TextField, CircularProgress, Paper } from '@mui/material';
import { auth } from './firebase'; // Importing auth using ./firebase

export default function Home() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(true); // Toggle between login and register
  const [showForm, setShowForm] = useState(false); // Control form visibility
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: `Hi, I'm the ProAssist Support Agent, how can I assist you today?`,
  }]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAuth = async () => {
    const authFunc = isLogin ? signInWithEmailAndPassword : createUserWithEmailAndPassword;
    try {
      const userCredential = await authFunc(auth, email, password);
      setUser(userCredential.user);
      setEmail('');
      setPassword('');
      setShowForm(false); // Hide form after successful login/register
      setMessages([{
        role: 'assistant',
        content: `Hi, I'm the ProAssist Support Agent, how can I assist you today?`,
      }]); // Reset chat history to initial state
    } catch (error) {
      console.error("Authentication error:", error.message);
      alert(error.message);
    }
  };

  const sendMessage = async () => {
    if (message.trim() === '') return;

    setMessage('');
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "user", content: message },
      { role: "assistant", content: '' },
    ]);

    const response = fetch('/api/chat', {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([...messages, { role: 'user', content: message }])
    }).then(async (res) => {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let result = '';
      return reader.read().then(function processText({ done, value }) {
        if (done) {
          return result;
        }
        const text = decoder.decode(value || new Int8Array(), { stream: true });
        setMessages((prevMessages) => {
          let lastMessage = prevMessages[prevMessages.length - 1];
          let otherMessages = prevMessages.slice(0, prevMessages.length - 1);

          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ];
        });
        return reader.read().then(processText);
      });
    });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error.message);
      alert(error.message);
    }
  };

  const handleHomeClick = () => {
    setShowForm(false); // Hide form and return to landing page
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(to bottom, black, purple, blue)',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box
        sx={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(to bottom, black, purple, blue)',
          padding: { xs: '10px', sm: '20px' },
        }}
      >
        {/* Fixed Menu Bar for Landing Page */}
        <AppBar position="fixed" sx={{ background: '#333', width: '100%' }}>
          <Toolbar sx={{ justifyContent: 'space-between', padding: { xs: '0 10px', sm: '0 20px' } }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <img src="/ProAssist_logo.jpeg" alt="ProAssist Logo" style={{ height: '30px', marginRight: '10px' }} />
              <Typography variant="h6" component="div" sx={{ fontSize: { xs: '16px', sm: '20px' } }}>
                ProAssist
              </Typography>
            </Box>
            <Box>
              <Button color="inherit" onClick={handleHomeClick} sx={{ fontSize: { xs: '12px', sm: '14px' } }}>Home</Button>
              <Button color="inherit" onClick={() => { setIsLogin(true); setShowForm(true); }} sx={{ fontSize: { xs: '12px', sm: '14px' } }}>Login</Button>
              <Button color="inherit" onClick={() => { setIsLogin(false); setShowForm(true); }} sx={{ fontSize: { xs: '12px', sm: '14px' } }}>Register</Button>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Logo Section with Shadow */}
        {!showForm && (
          <Box sx={{ mt: { xs: 8, sm: 10 }, textAlign: 'center' }}>
            <img 
              src="/ProAssist_logo.jpeg" 
              alt="ProAssist Logo" 
              style={{ 
                height: 'auto', 
                width: '80%',  // Adjusts to 80% of the container width for smaller screens
                maxWidth: '600px', // Limits the maximum width to 600px
                marginBottom: '20px', 
                boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.5)' 
              }} 
            />
          </Box>
        )}

        {/* Conditionally Rendered Login/Register Form */}
        {showForm && (
          <Paper elevation={6} sx={{ padding: { xs: 3, sm: 4 }, borderRadius: 3, background: 'rgba(255, 255, 255, 0.9)', mt: 4, width: { xs: '100%', sm: '400px' }, maxWidth: '100%' }}>
            <Stack spacing={3}>
              <Typography variant="h4" align="center" color="primary" sx={{ fontSize: { xs: '24px', sm: '28px' } }}>
                {isLogin ? 'Login' : 'Register'}
              </Typography>
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                sx={{ fontSize: { xs: '14px', sm: '16px' } }}
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                sx={{ fontSize: { xs: '14px', sm: '16px' } }}
              />
              <Button variant="contained" onClick={handleAuth} sx={{ background: '#DD2476', color: '#fff', fontSize: { xs: '14px', sm: '16px' } }}>
                {isLogin ? 'Login' : 'Register'}
              </Button>
            </Stack>
          </Paper>
        )}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(to bottom, black, purple, blue)',
        padding: { xs: '10px', sm: '20px' },
      }}
    >
      <AppBar position="fixed" sx={{ background: '#333' }}>
        <Toolbar sx={{ padding: { xs: '0 10px', sm: '0 20px' } }}>
          <img src="/ProAssist_logo.jpeg" alt="ProAssist Logo" style={{ height: '30px', marginRight: '10px' }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontSize: { xs: '16px', sm: '20px' } }}>
            ProAssist
          </Typography>
          <Button color="inherit" onClick={handleLogout} sx={{ fontSize: { xs: '12px', sm: '14px' } }}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: { xs: '70px', sm: '80px' }, // Ensure the chat box doesn't overlap with the AppBar
        }}
      >
        <Paper
          elevation={6}
          sx={{
            width: { xs: '90%', sm: '600px' },
            height: { xs: '70%', sm: '700px' }, // Adjust the height as needed
            maxHeight: '80vh', // Adjust the maximum height for phone screens
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 3,
            padding: 3,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 3,
            maxWidth: '100%',
          }}
        >
          <Typography variant="h6" align="center" sx={{ fontSize: { xs: '18px', sm: '20px' } }}>
            Welcome, {user.email}
          </Typography>
          <Stack
            direction="column"
            spacing={2}
            flexGrow={1}
            sx={{ 
              overflowY: 'auto', // Enable vertical scrolling
              maxHeight: 'calc(100% - 80px)', // Adjust height to leave space for the input area
              padding: 2, 
              background: '#f9f9f9', 
              borderRadius: 3 
            }}
          >
            {messages.map((message, index) => (
              <Box
                key={index}
                display='flex'
                justifyContent={message.role === 'assistant' ? 'flex-start' : 'flex-end'}
              >
                <Box
                  sx={{
                    bgcolor: message.role === 'assistant' ? '#800080' : '#0000FF',
                    color: 'white',
                    borderRadius: 16,
                    p: 2,
                    maxWidth: '75%',
                    boxShadow: 2,
                  }}
                >
                  {message.content}
                </Box>
              </Box>
            ))}
          </Stack>
          <Stack direction="row" spacing={2} sx={{ marginTop: 2 }}>
            <TextField
              label="Message"
              fullWidth
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              sx={{ fontSize: { xs: '14px', sm: '16px' } }}
            />
            <Button variant="contained" onClick={sendMessage} sx={{ background: '#0000FF', color: '#fff', fontSize: { xs: '14px', sm: '16px' } }}>
              SEND
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
//done