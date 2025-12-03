"use client";

import Link from 'next/link';
import Image from "next/image";
import { useState, useEffect } from "react";

export default function Home() {

  // Only third rectangle slides
  const sliderImages = ["/img3.jpg", "/img4.jpg", "/img5.jpg"];

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
              src="/img1.jpg"
              alt="Image 1"
              width={800}
              height={450}
              className="w-full h-full object-cover transition-all duration-700"
            />
          </div>

          {/* Rectangle 2 - FIXED */}
          <div className="w-full aspect-[16/9] bg-gray-200 rounded-lg overflow-hidden shadow-lg">
            <Image
              src="/img2.jpg"
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

          {/* Login & Register Buttons */}
          <div className="flex flex-row space-x-6 mt-6 justify-center">
            <Link
              href="/login"
              className="px-16 py-6 rounded-xl font-semibold text-2xl bg-green-500 text-black shadow-xl hover:shadow-2xl hover:scale-100 hover:brightness-120 transition-all duration-500 inline-block"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="px-16 py-6 rounded-xl font-semibold text-2xl bg-green-500 text-black shadow-xl hover:shadow-2xl hover:scale-100 hover:brightness-120 transition-all duration-500 inline-block"
            >
              Register
            </Link>
          </div>

        </div>

        {/* Info cards */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-bold text-blue-600 mb-3">For Students</h3>
            <ul className="text-gray-700 space-y-2">
              <li>• Register for exams</li>
              <li>• Download admission cards</li>
              <li>• View results online</li>
              <li>• Download papers & marking schemes</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-bold text-purple-600 mb-3">For Tutors</h3>
            <ul className="text-gray-700 space-y-2">
              <li>• Enter student marks</li>
              <li>• Upload papers & markings</li>
              <li>• View analytics</li>
              <li>• Track attendance</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-bold text-red-600 mb-3">For Admins</h3>
            <ul className="text-gray-700 space-y-2">
              <li>• Create & manage exams</li>
              <li>• Release admission cards</li>
              <li>• Publish results</li>
              <li>• Manage users</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
