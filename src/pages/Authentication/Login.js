import React, { useEffect, useState } from 'react';
import {
  Card,
  CardBody,
  Col,
  Container,
  Input,
  Label,
  Row,
  Button,
  Form,
  FormFeedback,
  Alert,
  Spinner
} from 'reactstrap';
import ParticlesAuth from "../AuthenticationInner/ParticlesAuth";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { useFormik } from "formik";
import { signIn } from '../../appwrite/Services/authServices';
// import logo from "../../assets/images/logo-light.png";
import { resetLoginFlag } from "../../slices/thunks"; // Adjust based on your project structure
import logo from "../../assets/images/logo.png";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [passwordShow, setPasswordShow] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Selectors to get auth state if using Redux
  const { error, loading, errorMsg } = useSelector(state => ({
    error: state.Login.error,
    loading: state.Login.loading,
    errorMsg: state.Login.errorMsg,
  }));

  // Formik setup
  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email format').required("Please Enter Your Email"),
      password: Yup.string().required("Please Enter Your Password"),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        console.log("Attempting to sign in...");
        await signIn(values.email, values.password);
        console.log("Login successful, navigating to dashboard.");
        navigate("/dashboard");
      } catch (error) {
        setErrorMessage(error.message || "Login failed. Please try again.");
        console.error("Login failed:", error);
        setSubmitting(false);
      }
    }
  });

  // Handle error messages from Redux
  useEffect(() => {
    if (errorMsg) {
      setErrorMessage(errorMsg);
      setTimeout(() => {
        dispatch(resetLoginFlag());
      }, 3000);
    }
  }, [dispatch, errorMsg]);

  document.title = "Admin Dashboard Sign In";

  return (
    <React.Fragment>
      <ParticlesAuth>
        <div className="auth-page-content mt-lg-5">
          <Container>
            <Row>
              <Col lg={12}>
                <div className="text-center mt-sm-5 mb-4 text-white-50">
                  <div>
                    <Link to="/" className="d-inline-block auth-logo">
                      <img src={logo} alt="" width="70" />
                    </Link>
                  </div>
                  <p className="mt-3 fs-15 fw-medium">Admin Dashboard</p>
                </div>
              </Col>
            </Row>

            <Row className="justify-content-center">
              <Col md={8} lg={6} xl={5}>
                <Card className="mt-4">
                  <CardBody className="p-4">
                    <div className="text-center mt-2">
                      <h5 className="text-primary">Welcome Back!</h5>
                      <p className="text-muted">Sign in to continue to your dashboard.</p>
                    </div>
                    {errorMessage && (
                      <Alert color="danger"> {errorMessage} </Alert>
                    )}
                    <div className="p-2 mt-4">
                      <Form onSubmit={formik.handleSubmit}>

                        <div className="mb-3">
                          <Label htmlFor="email" className="form-label">Email</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="Enter email"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.email}
                            invalid={formik.touched.email && formik.errors.email ? true : false}
                          />
                          {formik.touched.email && formik.errors.email ? (
                            <FormFeedback>{formik.errors.email}</FormFeedback>
                          ) : null}
                        </div>

                        <div className="mb-3">
                          <div className="float-end">
                            <Link to="/forgot-password" className="text-muted">Forgot password?</Link>
                          </div>
                          <Label className="form-label" htmlFor="password">Password</Label>
                          <div className="position-relative auth-pass-inputgroup mb-3">
                            <Input
                              id="password"
                              name="password"
                              type={passwordShow ? "text" : "password"}
                              placeholder="Enter Password"
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              value={formik.values.password}
                              invalid={formik.touched.password && formik.errors.password ? true : false}
                            />
                            {formik.touched.password && formik.errors.password ? (
                              <FormFeedback>{formik.errors.password}</FormFeedback>
                            ) : null}
                            <button
                              className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted"
                              type="button"
                              onClick={() => setPasswordShow(!passwordShow)}
                            >
                              <i className={`ri-eye-${passwordShow ? 'close-fill' : 'fill'} align-middle`}></i>
                            </button>
                          </div>
                        </div>

                        <div className="form-check">
                          <Input className="form-check-input" type="checkbox" id="remember-me" />
                          <Label className="form-check-label" htmlFor="remember-me">Remember me</Label>
                        </div>

                        <div className="mt-4">
                          <Button
                            color="success"
                            type="submit"
                            className="w-100"
                            disabled={formik.isSubmitting || loading}
                          >
                            {formik.isSubmitting || loading ? <Spinner size="sm" className='me-2' /> : null}
                            Sign In
                          </Button>
                        </div>

                        
                      </Form>
                    </div>
                  </CardBody>
                </Card>

               

              </Col>
            </Row>
          </Container>
        </div>
      </ParticlesAuth>
    </React.Fragment>
  );
};

export default Login;

