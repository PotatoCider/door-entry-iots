import { FormControl, FormLabel, Input, FormErrorMessage, InputProps, FormControlProps } from "@chakra-ui/react"
import { FC, PropsWithChildren } from "react"
import { FieldError, FieldValues, Path, RegisterOptions, UseFormRegister } from "react-hook-form"


type FormFieldProps<I> = {
  name: Path<I>
  label: string
  type: string
  r?: UseFormRegister<I>
  options?: RegisterOptions
  required?: boolean
  error?: FieldError
  inputProps?: InputProps
  formProps?: FormControlProps
}

function FormField<I>({ name, label, type, r: register, options, required, error, inputProps, formProps, children }: PropsWithChildren<FormFieldProps<I>>) {
  return (
    <FormControl mt={4} isRequired={required} isInvalid={!!error} {...formProps}>
      <FormLabel>{label}</FormLabel>
      <Input type={type} {...(register && register(name, options))} {...inputProps} />
      {children}
      <FormErrorMessage>{error?.message}</FormErrorMessage>
    </FormControl>
  )
}

export default FormField