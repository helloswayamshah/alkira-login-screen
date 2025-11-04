export const useApi = async (method, path, headers, body ) => {
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
  console.log("Backend URL:", BACKEND_URL);
  try {
    const response = await fetch(`${BACKEND_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return response;
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};
