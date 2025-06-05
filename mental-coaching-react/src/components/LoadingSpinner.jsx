const LoadingSpinner = ({ message = 'Lädt...' }) => (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <div className="spinner" />
      <p>{message}</p>
    </div>
  );
  
  export default LoadingSpinner;
  