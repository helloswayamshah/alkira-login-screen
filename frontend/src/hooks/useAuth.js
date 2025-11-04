const useAuth = () => {
  function isUserLoggedIn() {
    // Implement your logic to check if the user is logged in
    // For example, check for a valid authentication token in localStorage
    const token = localStorage.getItem('access_token');
    return token !== null;
  }

  return { isUserLoggedIn };
};

export { useAuth };