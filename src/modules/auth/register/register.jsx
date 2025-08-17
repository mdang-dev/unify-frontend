"use client";

import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";
import FullUnifyLogoIcon from "@/src/components/global/FullUnifyLogoIcon_Auth";
import { Button } from "@/src/components/ui/button";
import DateSelector from "@/src/components/global/DateInput";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { authCommandApi } from '@/src/apis/auth/command/auth.command.api';
import { Eye, EyeOff } from 'lucide-react';

const RegisterPage = () => {
  const t = useTranslations('Auth.Register');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const router = useRouter();

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "true",
    status: 0,
    agreeToTerms: false,
  });

  const [date, setDate] = useState({
    day: "",
    month: "",
    year: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const registerMutation = useMutation({
    mutationFn: authCommandApi.register,
  });

  const validateForm = () => {
    let newErrors = {};

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    // Username validation - matches backend pattern: ^[a-zA-Z0-9_]{3,20}$
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
      newErrors.username = "Username must be 3-20 characters long and contain only letters, numbers, and underscores";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    // Password validation - matches backend pattern: ^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/.test(formData.password)) {
      newErrors.password = "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number";
    }

    // Confirm password validation
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Birthday validation
    if (!date.day || !date.month || !date.year) {
      newErrors.birthDay = "Birthday is required";
    } else {
      const today = new Date();
      const birthDate = new Date(
        `${date.year}-${months.indexOf(date.month) + 1}-${date.day}`
      );
      
      // Check if birthday is in the past
      if (birthDate >= today) {
        newErrors.birthDay = "Birthday must be in the past";
      } else {
        // Age validation (must be at least 13)
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }
        if (age < 13) {
          newErrors.birthDay = "You must be at least 13 years old";
        }
      }
    }

    // Terms agreement validation
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms of service";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const fullDate = `${date.year}-${String(
      months.indexOf(date.month) + 1
    ).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;

    const requestData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      username: formData.username,
      email: formData.email,
      password: formData.password,
      gender: formData.gender === "true", // Convert string to boolean
      birthDay: fullDate,
    };

         registerMutation.mutate(requestData, {
       onSuccess: () => {
         setTimeout(() => {
           router.push("/login");
         }, 1500);
       },
      onError: (err) => {
        console.error('❌ Register error:', err);
        // Handle specific backend error messages
        if (err?.response?.data) {
          // Backend validation errors come as array of field errors
          if (Array.isArray(err.response.data)) {
            const errorMessages = err.response.data.map(error => error.message || error).join(', ');
            setServerError(errorMessages);
          } else {
            setServerError(err.response.data);
          }
        } else if (err?.message) {
          setServerError(err.message);
        } else {
          setServerError("Something went wrong. Please try again.");
        }
      },
    });
  };

  return (
    <div className={`w-full grid place-content-center`}>
      <div>
        <form onSubmit={handleSubmit}>
          <div className={`grid gap-5`}>
                         <div align="center">
               <FullUnifyLogoIcon className="mr-7" />
             </div>
            <div className="flex gap-2">
              <div className="basis-1/2">
                <Input
                  name="firstName"
                  placeholder={t('FirstName')}
                  className="h-12"
                  value={formData.firstName}
                  onChange={handleChange}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm">{errors.firstName}</p>
                )}
              </div>
              <div className="basis-1/2">
                <Input
                  name="lastName"
                  placeholder={t('LastName')}
                  className="h-12"
                  value={formData.lastName}
                  onChange={handleChange}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm">{errors.lastName}</p>
                )}
              </div>
            </div>
            <div className="basis-1/2">
              <Input
                name="username"
                placeholder={t('Username')}
                className="h-12"
                value={formData.username}
                onChange={handleChange}
              />
              {errors.username && (
                <p className="text-red-500 text-sm">{errors.username}</p>
              )}
            </div>
            <div className="basis-1/2">
              <Input
                name="email"
                placeholder={t('Email')}
                className="h-12"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email}</p>
              )}
            </div>
                         <div className="basis-1/2">
               <div className="relative">
                 <Input
                   name="password"
                   placeholder={t('Password')}
                   className="h-12 pr-10"
                   type={showPassword ? "text" : "password"}
                   value={formData.password}
                   onChange={handleChange}
                 />
                 <button
                   type="button"
                   onClick={() => setShowPassword(!showPassword)}
                   className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-neutral-500 dark:hover:text-neutral-300"
                 >
                   {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                 </button>
               </div>
               {errors.password && (
                 <p className="text-red-500 text-sm">{errors.password}</p>
               )}
             </div>

                         <div className="basis-1/2">
               <div className="relative">
                 <Input
                   name="confirmPassword"
                   placeholder={t('ConfirmPassword')}
                   className="h-12 pr-10"
                   type={showConfirmPassword ? "text" : "password"}
                   value={formData.confirmPassword}
                   onChange={handleChange}
                 />
                 <button
                   type="button"
                   onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                   className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-neutral-500 dark:hover:text-neutral-300"
                 >
                   {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                 </button>
               </div>

               {errors.confirmPassword && (
                 <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
               )}
             </div>

            <div className="flex gap-2">
              <RadioGroup
                onValueChange={(value) =>
                  setFormData({ ...formData, gender: value })
                }
                defaultValue="true"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="r1" defaultChecked={true} />
                  <Label htmlFor="r1">{t('Male')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="r2" />
                  <Label htmlFor="r2">{t('Female')}</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="basis-1/2">
              <DateSelector date={date} setDate={setDate} months={months} />
              {errors.birthDay && (
                <p className="text-red-500 text-sm">{errors.birthDay}</p>
              )}
            </div>

            {serverError && (
              <p className="text-red-500 text-sm">{serverError}</p>
            )}

            <div className="flex items-center gap-1 m-auto">
              <span>{t('AlreadyHaveAccount')}</span>
              <Link href="/login" className="text-[#0F00E1]">
                {t('SignIn')}
              </Link>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="terms"
                checked={formData.agreeToTerms}
                onChange={(e) =>
                  setFormData((prevData) => ({
                    ...prevData,
                    agreeToTerms: e.target.checked,
                  }))
                }
              />
              <Label htmlFor="terms" className="text-sm">
                {t('AgreeToTerms')}{" "}
                <Link href="/landing" className="text-blue-600 underline">
                  {t('TermsOfService')}
                </Link>
              </Label>
            </div>
            {errors.agreeToTerms && (
              <p className="text-red-500 text-sm">{errors.agreeToTerms}</p>
            )}

            <Button 
              type="submit" 
              className="text-2xl p-6 mt-3"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? t('SigningUp') : t('SignUp')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
