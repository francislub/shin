"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Child {
  id: string
  name: string
  class: string
  rollNumber: string
  photo?: string
}

export function ParentChildrenList() {
  const [children, setChildren] = useState<Child[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const token = localStorage.getItem("token")

        if (!token) {
          return
        }

        const response = await fetch("/api/parent/children", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setChildren(data)
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch children data",
          })
        }
      } catch (error) {
        console.error("Children data error:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred while fetching children data",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchChildren()
  }, [toast])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="flex items-center space-x-4 rounded-md border p-4">
            <div className="h-12 w-12 animate-pulse rounded-full bg-muted"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 w-1/3 animate-pulse rounded bg-muted"></div>
              <div className="h-3 w-1/4 animate-pulse rounded bg-muted"></div>
            </div>
            <div className="h-8 w-20 animate-pulse rounded bg-muted"></div>
          </div>
        ))}
      </div>
    )
  }

  if (children.length === 0) {
    return <p className="text-center text-muted-foreground py-4">No children found</p>
  }

  return (
    <div className="space-y-4">
      {children.map((child) => (
        <div key={child.id} className="flex items-center space-x-4 rounded-md border p-4">
          <Avatar>
            <AvatarImage src={child.photo || "/placeholder.svg"} alt={child.name} />
            <AvatarFallback>{child.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium">{child.name}</p>
            <p className="text-sm text-muted-foreground">
              {child.class} • Roll No: {child.rollNumber}
            </p>
          </div>
          <Button asChild size="sm">
            <Link href={`/parent/children/${child.id}`}>View Details</Link>
          </Button>
        </div>
      ))}
    </div>
  )
}
