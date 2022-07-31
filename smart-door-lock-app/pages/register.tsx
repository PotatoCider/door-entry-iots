import { Button } from "@chakra-ui/button"
import { FormControl, FormLabel } from "@chakra-ui/form-control"
import { Input } from "@chakra-ui/input"
import { Flex, Heading, Text } from "@chakra-ui/layout"
import { Alert, AlertDescription, AlertIcon, FormErrorMessage, Link } from "@chakra-ui/react"
import { NextPage } from "next"
import Head from "next/head"
import { useRouter } from "next/router"
import { useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { RequestData, ResponseData } from "./api/register"


type Inputs = RequestData

const Register: NextPage = () => {
  const router = useRouter()
  const { handleSubmit, register, setError, formState: { errors } } = useForm<Inputs>()
  const [genericError, setGenericError] = useState('')

  const onSubmit: SubmitHandler<Inputs> =
    (data: Inputs) => fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json())
      .then((data: ResponseData) => {
        if (data.ok) {
          router.push('/dashboard')
        } else if (data.errorType) {
          setError(data.errorType, { message: data.error })
          setGenericError('')
        } else {
          setGenericError(data.error ?? '')
        }
      })
  return (
    <div>
      <Head>
        <title>Register</title>
        <meta name="description" content="Enter your login details" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Flex justify={'center'}>
        <Flex direction={'column'} minWidth={300}>
          <Heading mt={128}>Register</Heading>
          <form onSubmit={handleSubmit(onSubmit)}>

            <FormControl mt={4} isRequired isInvalid={!!errors.name}>
              <FormLabel>Name</FormLabel>
              <Input type='text' {...register('name')} />
              <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
            </FormControl>

            <FormControl mt={4} isRequired isInvalid={!!errors.username}>
              <FormLabel>Username</FormLabel>
              <Input type='text' {...register('username')} />
              <FormErrorMessage>{errors.username?.message}</FormErrorMessage>
            </FormControl>

            <FormControl mt={4} isRequired isInvalid={!!errors.email}>
              <FormLabel>Email</FormLabel>
              <Input type='email' {...register('email')} />
              <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
            </FormControl>

            <FormControl mt={4} isRequired isInvalid={!!errors.newPassword}>
              <FormLabel>New Password</FormLabel>
              <Input type='password' {...register('newPassword')} />
              <FormErrorMessage>{errors.newPassword?.message}</FormErrorMessage>
            </FormControl>

            <FormControl mt={4} isRequired isInvalid={!!errors.confirmPassword}>
              <FormLabel>Confirm Password</FormLabel>
              <Input type='password' {...register('confirmPassword')} />
              <FormErrorMessage>{errors.confirmPassword?.message}</FormErrorMessage>
            </FormControl>

            <Alert status='error' display={genericError ? undefined : 'none'} mt={4}>
              <AlertIcon />
              <AlertDescription>{genericError}</AlertDescription>
            </Alert>

            <Button type='submit' minWidth={300} mt={4} paddingX={8} colorScheme='orange'>Register</Button>
          </form>
          <Text m='auto' mt={4}>
            Already have an account?{' '}
            <Link href='/login' color='teal.500'>Login</Link>
          </Text>
        </Flex>
      </Flex>
    </div>


  )
}

export default Register