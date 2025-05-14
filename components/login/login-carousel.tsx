"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"

type CarouselItem = {
  image: string
  title: string
  subtitle: string
}

const carouselItems: CarouselItem[] = [
  {
    image: "/buil.jpeg",
    title: "Data-Driven Outcomes",
    subtitle: "Build Future Leaders",
  },
  {
    image: "/pip.jpeg",
    title: "Streamlined Administration",
    subtitle: "Focus on What Matters",
  },
  {
    image: "/pipp.jpeg",
    title: "Comprehensive Management",
    subtitle: "One Platform for All",
  },
]

export function LoginCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % carouselItems.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const goToPrevious = () => {
    setActiveIndex((current) => (current === 0 ? carouselItems.length - 1 : current - 1))
  }

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % carouselItems.length)
  }

  const goToSlide = (index: number) => {
    setActiveIndex(index)
  }

  return (
    <div className="carousel h-full">
      <div className="carousel-inner h-full" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
        {carouselItems.map((item, index) => (
          <div key={index} className="carousel-item h-full relative">
            <div className="absolute inset-0 bg-black/40 z-10"></div>
            <Image
              src={item.image || "/placeholder.svg"}
              alt={item.title}
              fill
              style={{ objectFit: "cover" }}
              priority={index === 0}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-20">
              <h2 className="text-4xl font-bold mb-2">{item.title}</h2>
              <p className="text-xl">{item.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      <button className="carousel-control carousel-control-prev" onClick={goToPrevious} aria-label="Previous slide">
        <ChevronLeft size={24} />
      </button>

      <button className="carousel-control carousel-control-next" onClick={goToNext} aria-label="Next slide">
        <ChevronRight size={24} />
      </button>

      <div className="carousel-indicators">
        {carouselItems.map((_, index) => (
          <button
            key={index}
            className={`carousel-indicator ${index === activeIndex ? "active" : ""}`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          ></button>
        ))}
      </div>
    </div>
  )
}
