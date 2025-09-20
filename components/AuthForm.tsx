
"use client"

 
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import Image from "next/image";
import {useRouter} from "next/navigation";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { toast } from "sonner";


const authFormSchema = (type: FormType) => {
    return z.object({
        name:type === 'sign-up' ? z.string().min(3) : z.string().optional(),
        email: z. string().email(),
        password: z. string().min(3),
    })
}


const AuthForm = ( { type }: { type: FormType } ) => {
    const router = useRouter();
    const formSchema = authFormSchema(type);
    // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
        email: "",
        password: "",
    },
  })
 
  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
   try{
    if( type ==='sign-up') {
        toast. success( 'Account created successfully. Please sign in.');
        router.push('/sign-in');
    } else{
        toast. success( 'Sign in successfully.');
        router.push('/');

    }

   } catch (error) {
    console.log(error);
    toast
   }
  }

  const isSignIn = type === 'sign-in';    

  return (
    <div className="card-border w-full max-w-lg">
        <div className="flex flex-col gap-5 card py-10 px-8">
            <div className="flex flex-row gap-2 justify-center items-center">
                <Image src="/logo.png" alt="logo" height={32} width={38} />
                <h2 className="text-primary-100"> MockMate </h2>     
                 </div> 
                 <h3 className="text-center">Your Ultimate AI Mock Interview Coach
                    
                 </h3>
       

        <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6 mt-4 form" >
        {!isSignIn && (
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="label">Name</FormLabel>
                <FormControl>
                  <Input className="input" placeholder="Enter your name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="label">Email</FormLabel>
              <FormControl>
                <Input className="input" type="email" placeholder="Enter your email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="label">Password</FormLabel>
              <FormControl>
                <Input className="input" type="password" placeholder="Enter your password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="btn" type="submit"> {isSignIn ? 'Sign in' : 'Create an Account'}</Button>
      </form>
    </Form>
    <p className="text-center">
        {isSignIn ? 'No account yet?' : 'Have an account already?'}
        <Link href={!isSignIn ? '/sign-in' : '/sign-up'} className="font-bold text-user-primary ml-1">
            {isSignIn ? 'Sign up' : 'Sign in'}
        </Link>
    </p>
    
    </div>
     </div>
   
  )
}

export default AuthForm
