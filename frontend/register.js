document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const button = document.getElementById('submitButton');
  button.disabled = true;
  const email = document.getElementById('email').value.trim();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const pattern = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;
  if (!pattern.test(email)) {
    alert('Please enter a valid email.');
    button.disabled = false;
    return;
  }
  if(username.length > 40 || username < 1) {
    alert('Username is eather too long or too short.');
    button.disabled = false;
    return;
  }
  if (password.length < 6) {
    alert('Password must be at least 6 characters long.');
    button.disabled = false;
    return;
  }
  if (password !== confirmPassword) {
    alert('Passwords do not match.');
    button.disabled = false;
    return;
  }

  try {
    console.log('pressed')
    const response = await fetch('http://localhost:5000/auth/register', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username })
    });

    if(response.ok) {
      console.log(response.cookies);
      window.location.href = 'http://localhost:5000';
    } else {
      const data = await response.json();
      alert(data.message || 'Registration failed');
    }
  } catch (err) {
    alert('Failed to connect to server.');
    console.error(err);
  }
  finally {
    button.disabled = false;
  }
});
