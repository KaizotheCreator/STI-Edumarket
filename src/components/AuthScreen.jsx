import React from 'react'
import BrandMark from './BrandMark'
import { Field, PasswordField } from './Field'
import { preferredItemOptions } from '../data'

export default function AuthScreen({
  route,
  authMessage,
  loadingAction,
  loginForm,
  signupForm,
  loginErrors,
  signupErrors,
  showLoginPassword,
  showSignupPassword,
  showSignupConfirmPassword,
  onNavigate,
  onLoginChange,
  onSignupChange,
  onSubmitLogin,
  onSubmitSignup,
  onTogglePreferredItem,
  onToggleLoginPassword,
  onToggleSignupPassword,
  onToggleSignupConfirmPassword,
}) {
  const isLogin = route === '/login'

  return (
    <div className="auth-shell">
      <section className="auth-card">
        <BrandMark className="auth-brandmark" />

          <div className="auth-brand">
            <p className="eyebrow">Student access</p>
            <h1>{isLogin ? 'Login to EduMarket' : 'Create your verified student account'}</h1>
            <p className="lead">
              {isLogin
              ? 'Use your student number and password to enter the marketplace.'
              : 'Sign up with your student details and preferred items to get started.'}
            </p>
        </div>

        {authMessage ? <div className="auth-message">{authMessage}</div> : null}

        <div className="auth-tabs" role="tablist" aria-label="Authentication tabs">
          <button
            type="button"
            className={`auth-tab ${isLogin ? 'auth-tab--active' : ''}`}
            onClick={() => onNavigate('/login')}
          >
            Login
          </button>
          <button
            type="button"
            className={`auth-tab ${!isLogin ? 'auth-tab--active' : ''}`}
            onClick={() => onNavigate('/signup')}
          >
            Signup
          </button>
        </div>

        {isLogin ? (
            <form className="auth-form" onSubmit={onSubmitLogin}>
              <Field label="Student Number" error={loginErrors.studentNumber}>
                <input
                  className="input"
                  inputMode="numeric"
                maxLength={11}
                value={loginForm.studentNumber}
                onChange={(event) =>
                  onLoginChange({
                    studentNumber: event.target.value.replace(/\D/g, ''),
                  })
                }
                  placeholder="11-digit student number"
                />
              </Field>
              <PasswordField
                label="Password"
                value={loginForm.password}
                visible={showLoginPassword}
              onToggle={onToggleLoginPassword}
              onChange={(event) => onLoginChange({ password: event.target.value })}
              error={loginErrors.password}
              placeholder="Enter your password"
            />
            <button className="button button--primary" type="submit" disabled={loadingAction}>
              Login
            </button>
            <button
              className="button button--ghost"
              type="button"
              onClick={() => onNavigate('/signup')}
              disabled={loadingAction}
            >
              Create an account
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={onSubmitSignup}>
            <Field label="Student Number" error={signupErrors.studentNumber}>
              <input
                className="input"
                inputMode="numeric"
                maxLength={11}
                value={signupForm.studentNumber}
                onChange={(event) =>
                  onSignupChange({
                    studentNumber: event.target.value.replace(/\D/g, ''),
                  })
                }
                placeholder="11-digit student number"
              />
            </Field>
            <Field label="Full Name" error={signupErrors.fullName}>
              <input
                className="input"
                value={signupForm.fullName}
                onChange={(event) => onSignupChange({ fullName: event.target.value })}
                placeholder="Your complete name"
              />
            </Field>
            <Field label="Section" error={signupErrors.section}>
              <input
                className="input"
                value={signupForm.section}
                onChange={(event) => onSignupChange({ section: event.target.value })}
                placeholder="Example: BSIT 101"
              />
            </Field>
            <Field label="Birthday" error={signupErrors.birthday}>
              <input
                className="input"
                type="date"
                value={signupForm.birthday}
                onChange={(event) => onSignupChange({ birthday: event.target.value })}
              />
            </Field>
            <PasswordField
              label="Password"
              value={signupForm.password}
              visible={showSignupPassword}
              onToggle={onToggleSignupPassword}
              onChange={(event) => onSignupChange({ password: event.target.value })}
              error={signupErrors.password}
              placeholder="At least 6 characters"
            />
            <PasswordField
              label="Confirm Password"
              value={signupForm.confirmPassword}
              visible={showSignupConfirmPassword}
              onToggle={onToggleSignupConfirmPassword}
              onChange={(event) => onSignupChange({ confirmPassword: event.target.value })}
              error={signupErrors.confirmPassword}
              placeholder="Re-enter your password"
            />

            <div className="preferred-group">
              <span className="field__label">Preferred Items</span>
              <div className="preferred-grid">
                {preferredItemOptions.map((item) => (
                  <label key={item} className="preferred-option">
                    <input
                      type="checkbox"
                      checked={signupForm.preferredItems.includes(item)}
                      onChange={() => onTogglePreferredItem(item)}
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <button className="button button--yellow" type="submit" disabled={loadingAction}>
              Sign Up
            </button>
            <button
              className="button button--ghost"
              type="button"
              onClick={() => onNavigate('/login')}
              disabled={loadingAction}
            >
              I already have an account
            </button>
          </form>
        )}
      </section>
    </div>
  )
}
