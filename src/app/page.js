"use client";

import Link from 'next/link';
import Image from "next/image";
import { useState, useEffect } from "react";

export default function Home() {

  // Only third rectangle slides
  const sliderImages = ["/img3_.jpg", "/img4.jpg", "/img5_.jpg"];

  const [index3, setIndex3] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex3((p) => (p + 1) % sliderImages.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-700 to-blue-500">

      {/* Logo */}
      <div className="mb-4">
        <Image src="/logo.png" alt="Institute Logo" width={120} height={120} className="w-20 sm:w-[120px] h-auto" />
      </div>

      <div className="flex flex-col items-center mt-2">
        <Image src="/sipsara.png" alt="සිප්සර" width={300} height={80} className="w-48 sm:w-[300px]" />

        <h1 className="text-2xl sm:text-4xl font-bold">අධ්‍යාපන ආයතනය</h1>

        {/* 3 Rectangles */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-8 w-full px-4 max-w-8xl mx-auto">

          {/* Rectangle 1 - FIXED */}
          <div className="w-full aspect-[16/9] bg-gray-200 rounded-lg overflow-hidden shadow-lg">
            <Image
              src="/image.png"
              alt="Image 1"
              width={800}
              height={450}
              className="w-full h-full object-cover transition-all duration-700"
            />
          </div>

          {/* Rectangle 2 - FIXED */}
          <div className="w-full aspect-[16/9] bg-gray-200 rounded-lg overflow-hidden shadow-lg">
            <Image
              src="/img2.png"
              alt="Image 2"
              width={800}
              height={450}
              className="w-full h-full object-cover transition-all duration-700"
            />
          </div>

          {/* Rectangle 3 - SLIDING */}
          <div className="w-full aspect-[16/9] bg-gray-200 rounded-lg overflow-hidden shadow-lg col-span-2 lg:col-span-1">
            <Image
              src={sliderImages[index3]}
              alt="Slider 3"
              width={1600}
              height={900}
              className="w-full h-full object-cover transition-all duration-700"
            />
          </div>

        </div>
      </div>

      {/* Main container (login/register + info cards) */}
      <div className="container mx-auto px-4 py-8 sm:py-16">
        <div className="text-center text-white">
          <h1 className="text-4xl sm:text-6xl font-bold mb-4 sm:mb-6">Sipsara Institute</h1>
          <h2 className="text-2xl sm:text-3xl mb-6 sm:mb-8">The Institute of Knowledge</h2>
      
      <div className="flex flex-row justify-center space-x-4 mt-6 w-full px-4">

      {/* LOGIN */}
      <Link
        href="/login"
        className="
          flex-1 text-center 
          px-4 py-3 text-lg font-semibold 
          bg-green-500 text-black rounded-xl shadow-xl 
          max-w-[120px] sm:max-w-[180px]     /* size changes */
          sm:px-10 sm:py-6 sm:text-3xl         /* big screen size */
          hover:shadow-2xl hover:scale-105 hover:brightness-110 
          transition-all duration-500
        "
      >
        Login
      </Link>

      {/* REGISTER */}
      <Link
        href="/register"
        className="
          flex-1 text-center 
          px-4 py-3 text-lg font-semibold 
          bg-green-500 text-black rounded-xl shadow-xl 
          max-w-[120px] sm:max-w-[180px]     /* size changes */
          sm:px-10 sm:py-6 sm:text-3xl         /* big screen size */
          hover:shadow-2xl hover:scale-105 hover:brightness-110 
          transition-all duration-500
        "
      >
        Register
      </Link>
    </div>
    </div>

    {/* Info cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10 mb-5">
      <div className="bg-blue-200 rounded-lg p-6 shadow-lg flex items-center space-x-6 min-w-[280px] w-full">

        <Image
          src="/sinhala.jpg"
          alt="Students"
          width={150}
          height={150}
          className="w-20 h-20 object-contain flex-shrink-0"
        />

        <div className="flex-1 min-w-0">
          <h4 className="text-l font-bold text-black mb-3 break-words">සිංහල භාෂාව හා සාහිත්‍යය</h4>
          <ul className="text-gray-700 space-y-2">
            <li>• කසුන් වෙඩිසිංහ</li>
          </ul>
        </div>
      </div>
      <div className="bg-blue-200 rounded-lg p-6 shadow-lg flex items-center space-x-6 min-w-[280px] w-full">

        <Image
          src="/english.jpg"
          alt="Students"
          width={150}
          height={150}
          className="w-20 h-20 object-contain flex-shrink-0"
        />

        <div className="flex-1 min-w-0">
          <h4 className="text-l font-bold text-black mb-3 break-words">ඉංග්‍රීසි</h4>
          <ul className="text-gray-700 space-y-2">
            <li>• මලින් ප්‍රියනාත්</li>
          </ul>
        </div>
      </div>

      <div className="bg-blue-200 rounded-lg p-6 shadow-lg flex items-center space-x-6 min-w-[280px] w-full">

        <Image
          src="/maths.jpg"
          alt="Students"
          width={150}
          height={150}
          className="w-20 h-20 object-contain flex-shrink-0"
        />

        <div className="flex-1 min-w-0">
          <h4 className="text-l font-bold text-black mb-3 break-words">ගණිතය</h4>
          <ul className="text-gray-700 space-y-2">
            <li>• තාරක මධුශාල්</li>
          </ul>
        </div>
      </div>
      
      <div className="bg-blue-200 rounded-lg p-6 shadow-lg flex items-center space-x-6 min-w-[280px] w-full">

        <Image
          src="/science.jpg"
          alt="Students"
          width={150}
          height={150}
          className="w-20 h-20 object-contain flex-shrink-0"
        />

        <div className="flex-1 min-w-0">
          <h4 className="text-l font-bold text-black mb-3 break-words">විද්‍යාව</h4>
          <ul className="text-gray-700 space-y-2">
            <li>• ප්‍රසාද් ප්‍රියංකර</li>
          </ul>
        </div>
      </div>
      <div className="bg-blue-200 rounded-lg p-6 shadow-lg flex items-center space-x-6 min-w-[280px] w-full">

        <Image
          src="/history.jpg"
          alt="Students"
          width={150}
          height={150}
          className="w-20 h-20 object-contain flex-shrink-0"
        />

        <div className="flex-1 min-w-0">
          <h4 className="text-l font-bold text-black mb-3 break-words">ඉතිහාසය</h4>
          <ul className="text-gray-700 space-y-2">
            <li>• නිශාන් ප්‍රියංග</li>
          </ul>
        </div>
      </div>
      
    </div>
    </div>
    </div>
    
  );
}
