import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate } from "react-router-dom"

import { useToast } from "@/components/ui/use-toast"
import { Form, FormControl, FormField, FormItem, FormLabel, } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader } from "@/components/shared/Loader"

import { useCreateUserAccount, useSignInAccount } from "@/lib/react-query/queriesAndMutations"
import { SignupValidation } from "@/lib/validation"
import { useUserContext } from '@/context/AuthContext'

const SignupForm = () => {
    const { toast } = useToast()
    const navigate = useNavigate()
    const { checkAuthUser, isLoading: isUserLoading } = useUserContext()

    const { mutateAsync: createUserAccount, isPending: isCreatingUser } = useCreateUserAccount()
    const { mutateAsync: signInAccount, isPending: isSigningIn } = useSignInAccount()

    // Define the form
    // using <useForm> with <SignupValidation>
    const form = useForm<z.infer<typeof SignupValidation>>({
        resolver: zodResolver(SignupValidation),
        defaultValues: {
            name: '',
            username: '',
            email: '',
            password: '',
        },
    })

    // Handle form submission
    async function onSubmit(values: z.infer<typeof SignupValidation>) {
        // Create a new user
        const newUser = await createUserAccount(values)

        // show error toast if creation failed
        if (!newUser) {
            return toast({ title: "Sign up failed. Please try again.", })
        }

        // Sign in
        const session = await signInAccount({
            email: values.email,
            password: values.password,
        })
        // show error toast if sign in failed
        if (!session) {
            return toast({ title: "Sign in failed. Please try again.", })
        }

        // Check if user is logged in
        const isLoggedIn = await checkAuthUser()

        // Reset form if user is logged in
        // or show error toast
        if (isLoggedIn) {
            form.reset()

            navigate('/')
        } else {
            return toast({ title: "Sign up failed. Please try again.", })
        }
    }

    return (
        <Form {...form}>
            <div className="sm:w-420 flex-center flex-col">
                <img src='/assets/images/logo.svg' alt='logo' />
                <h2 className="h3-bold md:h2-bold pt-5 sm:pt-12">Create an new account</h2>
                <p className="text-light-3 small-medium md:base-regular mt-2">To use Snapgram, please enter your details</p>

                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5 w-full mt-4">
                    {/* Name */}
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input type="text" className="shad-input" {...field} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    {/* Username */}
                    <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                    <Input type="text" className="shad-input" {...field} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    {/* Email */}
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input type="email" className="shad-input" {...field} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    {/* Password */}
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input type="password" className="shad-input" {...field} />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <Button type="submit" className="shad-button_primary">
                        {isCreatingUser ? (
                            <div className="flex-center gap-2">
                                <Loader /> Loading...
                            </div>
                        ) : (
                            'Sign Up'
                        )}
                    </Button>
                </form>

                <p className="text-small-regular text-light-2 text-center mt-2">
                    Already have an account?
                    <Link to="/sign-in" className="text-primary-500 text-small-semibold ml-1">
                        Login
                    </Link>
                </p>
            </div>
        </Form>
    )
}

export default SignupForm