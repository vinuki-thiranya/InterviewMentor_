import React from 'react'
import { FormControl, FormField as RHFFormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Control } from "react-hook-form"

interface FormFieldProps {
  control: Control<any>
  label: string
  name: string
  type?: string
  placeholder?: string
}

const FormField = ({ 
  control,
  label, 
  name, 
  type = "text", 
  placeholder
}: FormFieldProps) => {
  return (
    <RHFFormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor={name}>{label}</FormLabel>
          <FormControl>
            <Input
              id={name}
              type={type}
              placeholder={placeholder}
              autoComplete={
                name === 'email' ? 'email' :
                name === 'password' ? 'current-password' :
                name === 'name' ? 'name' :
                'off'
              }
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export default FormField