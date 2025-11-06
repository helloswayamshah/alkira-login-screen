let MY_DB;
describe('SignUp and Login flow', () => {
  beforeEach(() => {
    MY_DB = [{email: 'xyz@gmail.com', password: 'Abc@1234', role: ['admin']}];
    cy.intercept('POST', '**/api/signup', (req) => {
      const { email, password, role } = req.body;
      const userExists = MY_DB.some((u) => u.email === email);
      if (userExists) {
        req.reply({
          statusCode: 400,
          body: { status: 'error', message: 'User already exists.' },
        });
      } else {
        MY_DB.push({ email, password, role: [role] });
        req.reply({
          statusCode: 200,
          body: { status: 'ok', message: 'Account created successfully. Please log in.' },
        });
      }
    }).as('signUpRequest');
    cy.intercept('POST', '**/api/login', (req) => {
      const { email, password } = req.body;
      const user = MY_DB.find((u) => u.email === email && u.password === password);
      if (user) {
        req.reply({
          statusCode: 200,
          body: { status: 'mfa_required', mfa_token: 'dummy_mfa_token', oob_code: email },
        });
      } else {
        req.reply({
          statusCode: 401,
          body: { status: 'error', message: 'Invalid email or password.' },
        });
      }
    }).as('loginRequest');
    cy.intercept('POST', '**/api/mfa-verify', (req) => {
      const { otp, oob_code } = req.body;
      if (otp === '123456') {
        req.reply({
          statusCode: 200,
          body: { status: 'ok', id_token: 'dummy_id_token', access_token: oob_code },
        });
      } else {
        req.reply({
          statusCode: 400,
          body: { status: 'invalid_grant', message: 'Invalid MFA verification.' },
        });
      }
    }).as('mfaVerifyRequest');
    cy.intercept('POST', '**/api/resend-mfa', (req) => {
      req.reply({
        statusCode: 200,
        body: { status: 'ok', message: 'OTP sent successfully.' },
      });
    }).as('resendMfaRequest');
    cy.intercept('GET', '**/api/roles', (req) => {
      const access_token = req.headers.authorization.split(' ')[1];
      const user = MY_DB.find((u) => u.email === access_token);
      if (user) {
        req.reply({
          statusCode: 200,
          body: { roles: user.role },
        });
        return;
      } else {
        req.reply({
          statusCode: 404,
          body: { message: 'User not found.' },
        });
      }
    }).as('rolesRequest');
  });
  it('SignUp Flow and login with newly created account gives the correct role', () => {
    cy.visit('/signup');
    cy.get('input[name="email"]').type("abc@xyz.com");
    cy.get('input[name="firstName"]').type("John");
    cy.get('input[name="lastName"]').type("Doe");
    cy.get('input[name="password"]').type("Xyz@1234");
    cy.get('input[name="confirmPassword"]').type("Xyz@1234");
    cy.get('input[type="radio"][aria-label="writer"]').check();
    cy.get('button').contains('Sign Up').click();
    cy.wait('@signUpRequest');
    cy.log(MY_DB);
    cy.contains('Account Created Successfully!');
    cy.contains('button', 'Go to Sign In').click();
    cy.contains('Welcome Back');
    cy.get('input[name="email"]').type("abc@xyz.com");
    cy.get('input[name="password"]').type("Xyz@1234");
    cy.get('button').contains('Sign in').click();
    cy.get('input[name="otp0"]').type('123456');
    cy.contains('button', 'Verify').click();
    cy.wait('@mfaVerifyRequest');
    cy.contains('Dashboard');
    cy.contains('writer');
  });
  it('Signup with existing email shows error', () => {
    cy.visit('/signup');
    cy.get('input[name="email"]').type("xyz@gmail.com");
    cy.get('input[name="password"]').type("Abc@1234");
    cy.get('input[name="firstName"]').type("John");
    cy.get('input[name="lastName"]').type("Doe");
    cy.get('input[name="confirmPassword"]').type("Abc@1234");
    cy.get('input[type="radio"][aria-label="reader"]').check();
    cy.get('button').contains('Sign Up').click();
    cy.wait('@signUpRequest');
    cy.contains('User already exists.');
  });
  it('Trying to signup with mismatched passwords shows error', () => {
    cy.visit('/signup');
    cy.get('input[name="email"]').type("abc@gmail.com");
    cy.get('input[name="firstName"]').type("John");
    cy.get('input[name="lastName"]').type("Doe");
    cy.get('input[name="password"]').type("Abc@1234");
    cy.get('input[name="confirmPassword"]').type("Abc@12345");
    cy.get('button').contains('Sign Up').click();
    cy.contains('Passwords do not match.');
  });
  it('Signup with weak password is not allowed', () => {
    cy.visit('/signup');
    cy.get('input[name="email"]').type("abc@gmail.com");
    cy.get('input[name="firstName"]').type("John");
    cy.get('input[name="lastName"]').type("Doe");
    cy.get('input[name="password"]').type("abc");
    cy.get('input[name="confirmPassword"]').type("abc");
    cy.get('button').contains('Sign Up').click();
    cy.contains('Password does not meet security requirements.');
  });
  it("A user signup with reader role cannot see the admin panel", () => {
    cy.visit('/signup');
    cy.get('input[name="email"]').type("abc@gmail.com");
    cy.get('input[name="firstName"]').type("John");
    cy.get('input[name="lastName"]').type("Doe");
    cy.get('input[name="password"]').type("Abc@1234");
    cy.get('input[name="confirmPassword"]').type("Abc@1234");
    cy.get('input[type="radio"][aria-label="reader"]').check();
    cy.get('button').contains('Sign Up').click();
    cy.wait('@signUpRequest');
    cy.contains('Account Created Successfully!');
    cy.contains('button', 'Go to Sign In').click();
    cy.contains('Welcome Back');
    cy.get('input[name="email"]').type("abc@gmail.com");
    cy.get('input[name="password"]').type("Abc@1234");
    cy.get('button').contains('Sign in').click();
    cy.get('input[name="otp0"]').type('123456');
    cy.contains('button', 'Verify').click();
    cy.wait('@mfaVerifyRequest');
    cy.contains('Dashboard');
    cy.get('button[aria-label="edit name"').should('not.exist');
  });
  it('Login with a user with writer role can see admin panel', () => {
    MY_DB[0].role = ['writer'];
    cy.visit('/');
    cy.get('input[name="email"]').type("xyz@gmail.com");
    cy.get('input[name="password"]').type("Abc@1234");
    cy.get('button').contains('Sign in').click();
    cy.get('input[name="otp0"]').type('123456');
    cy.contains('button', 'Verify').click();
    cy.wait('@mfaVerifyRequest');
    cy.contains('Dashboard');
    cy.get('button[aria-label="edit name"').should('exist');
  })
});

describe('SignUp and Validation flow', () => {});
