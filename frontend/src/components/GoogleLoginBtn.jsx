import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";

const GoogleLoginBtn = () => {
  const handleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post("http://localhost:5000/api/auth/google", {
        token: credentialResponse.credential,
      });

      localStorage.setItem("token", res.data.token);
      alert("Login Successful!");
      console.log(res.data.user);
    } catch (err) {
      alert("Login Failed");
      console.error(err);
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={() => console.log("Login Failed")}
    />
  );
};
const navigate = useNavigate();


export default GoogleLoginBtn;
