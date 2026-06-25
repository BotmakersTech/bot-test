export default function SocialAuth() {
  return (
    <>
      <div className="cna-divider">
        <span className="cna-divider-line" />
        <span className="cna-divider-text">OR</span>
        <span className="cna-divider-line" />
      </div>

      <div className="cna-social">
        <button type="button" className="cna-social-btn">
          Login with Google
        </button>

        <button type="button" className="cna-social-btn">
          Login with Facebook
        </button>
      </div>
    </>
  );
}