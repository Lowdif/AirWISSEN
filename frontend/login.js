document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const button = document.getElementById('submitButton');
  button.disabled = true;
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('http://localhost:5000/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();

    if (response.ok) {
      window.location.href = 'http://localhost:5000';
    } else {
      alert(data.message || 'Login failed');
    }
  } catch (err) {
    alert('Failed to connect to server.');
    console.error(err);
  } finally {
    button.disabled = false;
  }
});
