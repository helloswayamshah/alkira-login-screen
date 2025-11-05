let MY_DB = [{email: 'xyz@gmail.com', password: 'Abc@1234', role: ['admin']}];


describe('Basic Login Flow', () => {
  beforeEach(() => {
    // Reset MY_DB before each test
    MY_DB = [{email: 'xyz@gmail.com', password: 'Abc@1234', role: ['admin']}];
  });
  it('Visits the login page', () => {
    cy.visit('/');
    cy.contains('Please enter your details to sign in');
  });

  it('User tries to login wi th empty fields', () => {
    cy.visit('/');
    cy.contains('button', 'Sign in').click();
    cy.contains('Please enter valid email or password.');
  });
  it('User tries to login with invalid credentials', () => {
    cy.intercept('POST', 'http://localhost:3001/api/login', (req) => {
      const { email, password } = req.body;
      const user = MY_DB.find((u) => u.email === email && u.password === password);
      if (user) {
        req.reply({
          statusCode: 200,
          body: {
            status: 'ok',
            id_token: 'dummy_id_token',
            access_token: 'dummy_access_token',
          },
        });
      } else {
        req.reply({
          statusCode: 401,
          body: {
            status: 'error',
            message: 'Invalid email or password.',
          },
        });
      }
    }).as('loginRequest');
    cy.visit('/');
    cy.get('input[name="email"]').type('xyz@gmail.com');
    cy.get('input[name="password"]').type('WrongPassword@123');
    cy.contains('button', 'Sign in').click();
    cy.contains('Invalid email or password.');
  });
  it('User logs in with no password', () => {
    cy.visit('/');
    cy.get('input[name="email"]').type('xyz@gmail.com');
    cy.get('input[name="password"]').clear();
    cy.contains('button', 'Sign in').click();
    cy.contains('Please enter valid email or password.');
  });
  it('User logs in with invalid email format', () => {
    cy.visit('/');
    cy.get('input[name="email"]').type('invalidemailformat');
    cy.get('input[name="password"]').type('Abc@1234');
    cy.contains('button', 'Sign in').click();
    cy.contains('Please enter valid email or password.');
  });
  it('User can see the password when toggled and hides when hidden', () => {
    cy.visit('/');
    cy.get('input[name="password"]').type('Abc@1234');
    cy.get('button[aria-label="Show Password"]').click();
    cy.get('button[aria-label="Hide Password"]').should('exist');
    cy.get('input[name="password"]').should('have.attr', 'type', 'text');
    cy.get('button[aria-label="Hide Password"]').click();
    cy.get('button[aria-label="Show Password"]').should('exist');
    cy.get('input[name="password"]').should('have.attr', 'type',  'password');
  });
  it('User logs in with valid credentials', () => {
    cy.intercept('POST', 'http://localhost:3001/api/login', (req) => {
      const { email, password } = req.body;
      const user = MY_DB.find((u) => u.email === email && u.password === password);
      if (user) {
        req.reply({
          statusCode: 200,
          body: {
            status: 'mfa_required',
            mfa_token: 'dummy_mfa_token',
            oob_code: 'dummy_oob_code',
            challenge_type: 'oob',
            oob_channel: 'email',
          },});
      } else {
        req.reply({
          statusCode: 401,
          body: {
            status: 'error',
            message: 'Invalid email or password.',
          },});
      }
    }).as('loginRequest');
    cy.intercept('POST', 'http://localhost:3001/api/mfa-verify', (req) => {
      const { mfa_token, oob_code, otp } = req.body;
      if (mfa_token === 'dummy_mfa_token' && oob_code === 'dummy_oob_code' && otp === '123456') {
        req.reply({
          statusCode: 200,
          body: {
            status: 'ok',
            id_token: 'final_dummy_id_token',
            access_token: 'final_dummy_access_token',
          },});
      } else {
        req.reply({
          statusCode: 401,
          body: {
            status: 'error',
            message: 'Invalid MFA verification.',
          },});
      }
    }).as('mfaVerifyRequest');
    cy.intercept('GET', 'http://localhost:3001/api/roles', (req) => {
      req.reply({
        statusCode: 200,
        body: {
          status: 'ok',
          roles: MY_DB[0].role,
        },});
    }).as('getRolesRequest');

    cy.visit('/');
    cy.get('input[name="email"]').type('xyz@gmail.com');
    cy.get('input[name="password"]').type('Abc@1234');
    cy.contains('button', 'Sign in').click();
    cy.wait('@loginRequest');
    cy.contains('Enter Code');
    cy.get('input[name="otp0"]').type('123456');
    cy.contains('button', 'Verify').click();
    cy.wait('@mfaVerifyRequest');
    cy.contains('Dashboard');
    cy.wait('@getRolesRequest');
    cy.contains('admin');
  });

  it('User tries to login and fails MFA verification', () => {
    cy.intercept('POST', 'http://localhost:3001/api/login', (req) => {
      const { email, password } = req.body;
      const user = MY_DB.find((u) => u.email === email && u.password === password);
      if (user) {
        req.reply({
          statusCode: 200,
          body: {
            status: 'mfa_required',
            mfa_token: 'dummy_mfa_token',
            oob_code: 'dummy_oob_code',
            challenge_type: 'oob',
            oob_channel: 'email',
          },});
      } else {
        req.reply({
          statusCode: 401,
          body: {
            status: 'error',
            message: 'Invalid email or password.',
          },});
      }
    }).as('loginRequest');
    cy.intercept('POST', 'http://localhost:3001/api/mfa-verify', (req) => {
      const { mfa_token, oob_code, otp } = req.body;
      if (mfa_token === 'dummy_mfa_token' && oob_code === 'dummy_oob_code' && otp === '123456') {
        req.reply({
          statusCode: 200,
          body: {
            status: 'ok',
            id_token: 'final_dummy_id_token',
            access_token: 'final_dummy_access_token',
          },});
      } else {
        req.reply({
          statusCode: 401,
          body: {
            status: 'error',
            message: 'Incorrect OTP. Please try again.',
          },});
      }
    }).as('mfaVerifyRequest');
    cy.visit('/');
    cy.get('input[name="email"]').type('xyz@gmail.com');
    cy.get('input[name="password"]').type('Abc@1234');
    cy.contains('button', 'Sign in').click();
    cy.wait('@loginRequest');
    cy.contains('Enter Code');
    cy.get('input[name="otp0"]').type('000000');
    cy.contains('button', 'Verify').click();
    cy.wait('@mfaVerifyRequest');
    cy.contains('Incorrect OTP. Please try again.');
  });
  it('User tries to login with empty OTP', () => {
    cy.intercept('POST', 'http://localhost:3001/api/login', (req) => {
      const { email, password } = req.body;
      const user = MY_DB.find((u) => u.email === email && u.password === password);
      if (user) {
        req.reply({
          statusCode: 200,
          body: {
            status: 'mfa_required',
            mfa_token: 'dummy_mfa_token',
            oob_code: 'dummy_oob_code',
            challenge_type: 'oob',
            oob_channel: 'email',
          },});
      } else {
        req.reply({
          statusCode: 401,
          body: {
            status: 'error',
            message: 'Invalid email or password.',
          },});
      }
    }).as('loginRequest');
    cy.visit('/');
    cy.get('input[name="email"]').type('xyz@gmail.com');
    cy.get('input[name="password"]').type('Abc@1234');
    cy.contains('button', 'Sign in').click();
    cy.wait('@loginRequest');
    cy.contains('Enter Code');
    cy.contains('button', 'Verify').should('be.disabled');
  });
  it('User resends OTP', () => {
    let OTP = '123456';
    cy.intercept('POST', 'http://localhost:3001/api/login', (req) => {
      const { email, password } = req.body;
      const user = MY_DB.find((u) => u.email === email && u.password === password);
      if (user) {
        req.reply({
          statusCode: 200,
          body: {
            status: 'mfa_required',
            mfa_token: 'dummy_mfa_token',
            oob_code: 'dummy_oob_code',
            challenge_type: 'oob',
            oob_channel: 'email',
          },});
      } else {
        req.reply({
          statusCode: 401,
          body: {
            status: 'error',
            message: 'Invalid email or password.',
          },});
      }
    }).as('loginRequest');
    cy.intercept('POST', 'http://localhost:3001/api/resend-mfa', (req) => {
      OTP = '654321';  // Change OTP on resend
      req.reply({
        statusCode: 200,
        body: {
          status: 'mfa_required',
          mfa_token: 'mfa_token',
          oob_code: 'oob_code',
          challenge_type: 'oob',
          oob_channel: 'email',
        },});
    }).as('resendMfaRequest');
    cy.intercept('POST', 'http://localhost:3001/api/mfa-verify', (req) => {
      const { mfa_token, oob_code, otp } = req.body;
      if (mfa_token === 'dummy_mfa_token' && oob_code === 'dummy_oob_code' && otp === OTP) {
        req.reply({
          statusCode: 200,
          body: {
            status: 'ok',
            id_token: 'final_dummy_id_token',
            access_token: 'final_dummy_access_token',
          },});
      } else {
        req.reply({
          statusCode: 401,
          body: {
            status: 'error',
            message: 'Invalid MFA verification.',
          },});
      }
    }).as('mfaVerifyRequest');
    cy.visit('/');
    cy.get('input[name="email"]').type('xyz@gmail.com');
    cy.get('input[name="password"]').type('Abc@1234');
    cy.contains('button', 'Sign in').click();
    cy.wait('@loginRequest');
    cy.contains('Enter Code');
    // Resend OTP
    cy.wait(32000); // Wait for 1 second to enable resend button
    cy.contains('button', 'Resend').click();
    cy.wait('@resendMfaRequest');
    // Enter new OTP
    cy.get('input[name="otp0"]').type('654321');
    cy.contains('button', 'Verify').click();
    cy.wait('@mfaVerifyRequest');
    cy.contains('Dashboard');
  });
  it('User resends the OTP but uses old OTP to verify should fail', () => {
      let OTP = '123456';
    cy.intercept('POST', 'http://localhost:3001/api/login', (req) => {
      const { email, password } = req.body;
      const user = MY_DB.find((u) => u.email === email && u.password === password);
      if (user) {
        req.reply({
          statusCode: 200,
          body: {
            status: 'mfa_required',
            mfa_token: 'dummy_mfa_token',
            oob_code: 'dummy_oob_code',
            challenge_type: 'oob',
            oob_channel: 'email',
          },});
      } else {
        req.reply({
          statusCode: 401,
          body: {
            status: 'error',
            message: 'Invalid email or password.',
          },});
      }
    }).as('loginRequest');
    cy.intercept('POST', 'http://localhost:3001/api/resend-mfa', (req) => {
      OTP = '654321';  // Change OTP on resend
      req.reply({
        statusCode: 200,
        body: {
          status: 'mfa_required',
          mfa_token: 'mfa_token',
          oob_code: 'oob_code',
          challenge_type: 'oob',
          oob_channel: 'email',
        },});
    }).as('resendMfaRequest');
    cy.intercept('POST', 'http://localhost:3001/api/mfa-verify', (req) => {
      const { mfa_token, oob_code, otp } = req.body;
      if (mfa_token === 'dummy_mfa_token' && oob_code === 'dummy_oob_code' && otp === OTP) {
        req.reply({
          statusCode: 200,
          body: {
            status: 'ok',
            id_token: 'final_dummy_id_token',
            access_token: 'final_dummy_access_token',
          },});
      } else {
        req.reply({
          statusCode: 401,
          body: {
            status: 'error',
            message: 'Invalid MFA verification.',
          },});
      }
    }).as('mfaVerifyRequest');
    cy.visit('/');
    cy.get('input[name="email"]').type('xyz@gmail.com');
    cy.get('input[name="password"]').type('Abc@1234');
    cy.contains('button', 'Sign in').click();
    cy.wait('@loginRequest');
    cy.contains('Enter Code');
    // Resend OTP
    cy.wait(32000); // Wait for 1 second to enable resend button
    cy.contains('button', 'Resend').click();
    cy.wait('@resendMfaRequest');
    // Enter new OTP
    cy.get('input[name="otp0"]').type('123456');
    cy.contains('button', 'Verify').click();
    cy.wait('@mfaVerifyRequest');
    cy.contains('Invalid MFA verification.');
  });
});