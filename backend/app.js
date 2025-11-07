import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import jwt from "jsonwebtoken";
import { AUTH0_DB_CONNECTION, AUTH0_GRANT_TYPES, MFA_REQUIRED_ERROR } from "./constant.js";

dotenv.config('./.env');
const app = express();
app.use(express.json());
app.use(cors());


const parseAuth0Error = (error) => {
  if (!error || !error.error) return 'Unknown error';
  switch (error.error) {
    case 'invalid_grant':
      return 'Invalid email or password';
    case MFA_REQUIRED_ERROR:
      return 'MFA required';
    default:
      return error.error_description || error.error || 'Authentication failed';
  }
};

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID;
const AUTH0_SECRET = process.env.AUTH0_CLIENT_SECRET;
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;

app.post("/api/login", async (req, res) => {
  if (req.body == undefined) {
    return res.status(400).json({ message: "Request body is missing." });
  }
  const { email, password } = req.body;
  // Here you would normally validate the email and password with your user database
  if (email === "" || password === "" || email == undefined || password == undefined) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const response = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        grant_type: AUTH0_GRANT_TYPES['password'],
        realm: AUTH0_DB_CONNECTION,
        username: email,
        password,
        audience: AUTH0_AUDIENCE,
        client_id: AUTH0_CLIENT_ID,
        client_secret: AUTH0_SECRET,
        scope: 'openid profile email',
      }),
    });

    const data = await response.json();

    // 🧾 MFA required
    if (data.error === MFA_REQUIRED_ERROR) {
      const challenge = await fetch(`https://${AUTH0_DOMAIN}/mfa/challenge`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
          },
        body: JSON.stringify({
          mfa_token: data.mfa_token,
          client_id: AUTH0_CLIENT_ID,
          client_secret: AUTH0_SECRET,
          challenge_type: 'oob',
        }),
      });

      const challengeData = await challenge.json();
      if (challengeData.error) {
        return res
          .status(500)
          .json({ status: 'error', message: parseAuth0Error(challengeData) });
      }
      
      return res.status(200).json({
        status: 'mfa_required',
        mfa_token: data.mfa_token,
        oob_code: challengeData.oob_code,
        challenge_type: 'oob',
        oob_channel: 'email',
      });
          }
        
    // Invalid credentials
    if (data.error) {
      return res
        .status(401)
        .json({ status: 'error', message: parseAuth0Error(data) });
    }

    // Success
    return res.status(200).json({
      status: 'ok',
      id_token: data.id_token,
      access_token: data.access_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post("/api/signup", async (req, res) => {
  if (req.body == undefined) {
    return res.status(400).json({ message: "Request body is missing." });
  }
  const { email, password, first_name, last_name } = req.body;
  let { role } = req.body;
  if (email === "" || password === "" || email == undefined || password == undefined || first_name == undefined || last_name == undefined || first_name === "") {
    return res.status(400).json({ message: "email, first name and password are required!" });
  }
  const full_name = last_name ? `${first_name} ${last_name}` : first_name;
  if (role === "" || role == undefined) {
    role = "reader"; // default role
  }
  
  try {
    const accessResponse = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: AUTH0_CLIENT_ID,
        client_secret: AUTH0_SECRET,
        audience: `https://${AUTH0_DOMAIN}/api/v2/`,
      }),
    });
    const accessData = await accessResponse.json();
    const mgmtToken = accessData.access_token;

    const userExistsResponse = await fetch(`https://${AUTH0_DOMAIN}/api/v2/users-by-email?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${mgmtToken}`,
      },
    });
    const existingUsers = await userExistsResponse.json();
    if (existingUsers.length > 0) {
      return res
        .status(400)
        .json({ status: 'error', message: 'User with this email already exists.' });
    }
    const username = full_name.replaceAll(' ', '_'); // Auth0 usernames cannot have spaces
    const response = await fetch(`https://${AUTH0_DOMAIN}/dbconnections/signup`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        client_id: AUTH0_CLIENT_ID,
        name: username,
        email,
        password,
        connection: AUTH0_DB_CONNECTION,
      }),
    });
    const data = await response.json();
    
    if (data.error) {
      return res
        .status(400)
        .json({ status: 'error', message: parseAuth0Error(data) });
    }

    

    const rolesResponse = await fetch(`https://${AUTH0_DOMAIN}/api/v2/roles`, {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${mgmtToken}`,
      },
    });
    const rolesData = await rolesResponse.json();
    const roleObj = rolesData.find(r => r.name === role);
    if (!roleObj) {
      const deleteUserResponse = await fetch(`https://${AUTH0_DOMAIN}/api/v2/users/auth0|${data._id}`, {
        method: 'DELETE',
        headers: {
          'content-type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${mgmtToken}`,
        },
      });
      if (deleteUserResponse.ok) {
        console.log('User deleted due to invalid role.');
      } else {
        console.error('Failed to delete user with invalid role. Manual cleanup may be required.');
      }
      return res
        .status(400)
        .json({ status: 'error', message: 'Invalid role specified.' });
    }

    const roleId = roleObj.id;
    
    const assignResponse = await fetch(`https://${AUTH0_DOMAIN}/api/v2/roles/${roleId}/users`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${mgmtToken}`,
      },
      body: JSON.stringify({
        users: [`auth0|${data._id}`],
      }),
    });
    const assignData = await assignResponse.json();
    if (assignData.error) {
      console.error('Role assignment error:', assignData);
      const deleteUserResponse = await fetch(`https://${AUTH0_DOMAIN}/api/v2/users/auth0|${data._id}`, {
        method: 'DELETE',
        headers: {
          'content-type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${mgmtToken}`,
        },
      });
      if (deleteUserResponse.ok) {
        console.log('User deleted due to role assignment failure.');
      } else {
        console.error('Failed to delete user. Manual cleanup may be required.');
      }
      return res
        .status(500)
        .json({ status: 'error', message: parseAuth0Error(assignData) });
    }

    const enrollMfaResponse = await fetch(`https://${AUTH0_DOMAIN}/api/v2/users/auth0|${data._id}/authentication-methods`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${mgmtToken}`,
      },
      body: JSON.stringify({
        type: 'email',
        email: email,
      }),
    });
    const enrollMfaData = await enrollMfaResponse.json();
    if (enrollMfaData.error) {
      console.error('MFA enrollment error:', enrollMfaData);
      const deleteUserResponse = await fetch(`https://${AUTH0_DOMAIN}/api/v2/users/auth0|${data._id}`, {
        method: 'DELETE',
        headers: {
          'content-type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${mgmtToken}`,
        },
      });
      if (deleteUserResponse.ok) {
        console.log('User deleted due to MFA enrollment failure.');
      } else {
        console.error('Failed to delete user. Manual cleanup may be required.');
      }
      return res
        .status(500)
        .json({ status: 'error', message: parseAuth0Error(enrollMfaData) });
    }


    
    return res.status(200).json({
      status: 'ok',
      message: 'User registered successfully',
      data,
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});
app.post("/api/reset-password", async (req, res) => {
  if (req.body == undefined) {
    return res.status(400).json({ message: "Request body is missing." });
  }
  const { email } = req.body;
  if (email === "" || email == undefined) {
    return res.status(400).json({ message: "Email is required." });
  }
  
 try {
    const response = await fetch(`https://${AUTH0_DOMAIN}/dbconnections/change_password`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        client_id: AUTH0_CLIENT_ID,
        email,
        connection: AUTH0_DB_CONNECTION,
      }),
    });
    const data = await response.text();
    if (response.ok) {
      return res.status(200).json({
        status: 'ok',
        message: 'Password reset email sent successfully',
        data,
      });
    } else {
      if (response.status === 404) {
        return res
          .status(404)
          .json({ status: 'error', message: 'User with this email does not exist.' });
      } else if (response.status === 400) {
        console.error('Password reset error response:', data);
        return res
          .status(400)
          .json({ status: 'error', message: parseAuth0Error(data) });
      } else {
        console.error('Password reset error response:', data);
        return res
          .status(500)
          .json({ status: 'error', message: 'Failed to send password reset email.' });
      }
    }
  } catch (err) {
    console.error('Password reset error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
    
});

app.post("/api/mfa-verify", async (req, res) => {
  if (req.body == undefined) {
    return res.status(400).json({ message: "Request body is missing." });
  }
  const { mfa_token, otp, oob_code } = req.body;
  if (mfa_token === "" || otp === "" || mfa_token == undefined || otp == undefined || oob_code == undefined || oob_code === "") {
    return res.status(400).json({ message: "MFA token, OTP and oob code are required." });
  }

  try {
    const response = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        grant_type: AUTH0_GRANT_TYPES['mfa-oob'],
        client_id: AUTH0_CLIENT_ID,
        client_secret: AUTH0_SECRET,
        mfa_token,
        oob_code,
        binding_code: otp,
      }),
    });
    
    const data = await response.json();
    if (data.error) {
      return res
        .status(401)
        .json({ status: data.error || 'error', message: data.error_description || 'MFA verification failed' });
    }

    // Success
    return res.status(200).json({
      status: 'ok',
      id_token: data.id_token,
      access_token: data.access_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
    });
  } catch (err) {
    console.error('MFA verification error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.get("/api/roles", async (req, res) => {
  // Example protected endpoint to fetch user roles
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header is missing." });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.decode(token);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid token." });
    }
    console.log("Decoded token:", decoded);
    const roles = decoded["https://api.alkira.com/roles"] || [];

    return res.status(200).json({ roles });
  } catch (err) {
    console.error('Fetch roles error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post("/api/resend-mfa", async (req, res) => {
  if (req.body == undefined) {
    return res.status(400).json({ message: "Request body is missing." });
  }
  const { mfa_token } = req.body;
  if (mfa_token === "" || mfa_token == undefined) {
    return res.status(400).json({ message: "MFA token is required." });
  }

  try {
    const challenge = await fetch(`https://${AUTH0_DOMAIN}/mfa/challenge`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
          },
        body: JSON.stringify({
          mfa_token: mfa_token,
          client_id: AUTH0_CLIENT_ID,
          client_secret: AUTH0_SECRET,
          challenge_type: 'oob',
        }),
      });

      const challengeData = await challenge.json();
      if (challengeData.error) {
        return res
          .status(500)
          .json({ status: 'error', message: parseAuth0Error(challengeData) });
      }
      
      return res.status(200).json({
        status: 'mfa_required',
        mfa_token: mfa_token,
        oob_code: challengeData.oob_code,
        challenge_type: 'oob',
        oob_channel: 'email',
      });
  } catch (err) {
    console.error('Resend MFA error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
  
});

app.post("/api/edit-profile", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header is missing." });
  }
  const token = authHeader.split(" ")[1];
  const { first_name, last_name } = req.body;
  if (first_name === "" || first_name == undefined) {
    return res.status(400).json({ message: "First name is required." });
  }
  try {
    const decoded = jwt.decode(token);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid token." });
    }
    console.log("Decoded token:", decoded);
    const userId = decoded.sub;
    
    const full_name = last_name ? `${first_name} ${last_name}` : first_name;
    const accessResponse = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: AUTH0_CLIENT_ID,
        client_secret: AUTH0_SECRET,
        audience: `https://${AUTH0_DOMAIN}/api/v2/`,
      }),
    });
    const accessData = await accessResponse.json();
    const mgmtToken = accessData.access_token;
    const username = full_name.replaceAll(' ', '_'); // Auth0 usernames cannot have spaces
    
    const response = await fetch(`https://${AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${mgmtToken}`,
      },
      body: JSON.stringify({
        name: username,
      }),
    });
    const data = await response.json();
    console.log('Edit profile response data:', data);
    if (data.error) {
      return res
        .status(400)
        .json({ status: 'error', message: parseAuth0Error(data) });
    }
    
    return res.status(200).json({
      status: 'ok',
      first_name: first_name,
      last_name: last_name,
    });
  } catch (err) {
    console.error('Edit profile error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.get("/api/get-profile", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header is missing." });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.decode(token);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid token." });
    }
    console.log("Decoded token:", decoded);
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ error: 'Server error' });
  }

  const response = await fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const data = await response.json();
  const full_name = data.name ? data.name.replaceAll('_', ' ') : '';
  // console.log(full_name);
  console.log('User info data:', data);
  return res.status(200).json({
    email: data.email,
    full_name: full_name,
  });
});
  

app.listen(3001, () => {
  console.log("API server running on http://localhost:3001");
});