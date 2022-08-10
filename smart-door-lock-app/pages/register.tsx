import { Button } from '@chakra-ui/button'
import { Flex, Heading, Text } from '@chakra-ui/layout'
import { Alert, AlertDescription, AlertIcon, FormErrorMessage, Link } from '@chakra-ui/react'
import { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import FormField from '../components/FormField'
import { fetchJSON } from '../lib/api'
import { withSessionSsr } from '../lib/session'
import { RequestData, ResponseData } from './api/register'

export const getServerSideProps = withSessionSsr(
  async function getServerSideProps({ req }) {
    if (req.session.user) return {
      redirect: {
        destination: '/dashboard?message=' + encodeURIComponent('You are already logged in.'),
        permanent: false,
      }
    }
    return { props: {} }
  }
)

type Inputs = RequestData

const Register: NextPage = () => {
  const router = useRouter()
  const { handleSubmit, register, setError, formState: { errors } } = useForm<Inputs>()
  const [genericError, setGenericError] = useState('')

  const onSubmit: SubmitHandler<Inputs> =
    data => fetchJSON<ResponseData>('/api/register', 'POST', data)
      .then(data => {
        if (data.ok) {
          router.push({
            pathname: '/dashboard',
            query: { success: 'Successfully registered' },
          })
        } else if (data.errorField) {
          setError(data.errorField, { message: data.error })
          setGenericError('')
        } else {
          setGenericError(data.error ?? '')
        }
      })
  return (
    <Flex direction='column' minWidth={300}>
      <Head>
        <title>Register</title>
        <meta name='description' content='Enter your login details' />
        <link rel='icon' href='/favicon.ico' />
      </Head>


      <Heading>Register</Heading>

      <form onSubmit={handleSubmit(onSubmit)}>

        <FormField required name='name' type='text' label='Name'
          error={errors.name} r={register}
        />
        <FormField required name='username' type='text' label='Username'
          error={errors.username} r={register}
        />
        <FormField required name='email' type='email' label='Email'
          error={errors.email} r={register}
        />
        <FormField required name='newPassword' type='password' label='New Password'
          error={errors.newPassword} r={register}
        />
        <FormField required name='confirmPassword' type='password' label='Confirm Password'
          error={errors.confirmPassword} r={register}
        />
        {genericError &&
          <Alert status='error' mt={4}>
            <AlertIcon />
            <AlertDescription>{genericError}</AlertDescription>
          </Alert>}

        <Button type='submit' minWidth={300} mt={4} paddingX={8} colorScheme='orange'>Register</Button>
      </form>
      <Text m='auto' mt={4}>
        Already have an account?{' '}
        <Link href='/login' color='teal.500'>Login</Link>
      </Text>
    </Flex>
  )
}

export default Register