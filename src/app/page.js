"use client";

import Link from 'next/link';
import Image from "next/image";
import { useState, useEffect } from "react";

export default function Home() {
  // image sets for each rectangle
  const images1 = ["/img1.jpg", "/img2.jpg", "/img3.jpg"];
  const images2 = ["/img4.jpg", "/img5.jpg", "/img6.jpg"];
  const images3 = ["/img7.jpg", "/img8.jpg", "/img9.jpg"];

  const [index1, setIndex1] = useState(0);
  const [index2, setIndex2] = useState(0);
  const [index3, setIndex3] = useState(0);

  useEffect(() => {
    const timer1 = setInterval(() => setIndex1((p) => (p + 1) % images1.length), 5000);
    const timer2 = setInterval(() => setIndex2((p) => (p + 1) % images2.length), 5000);
    const timer3 = setInterval(() => setIndex3((p) => (p + 1) % images3.length), 5000);

    return () => {
      clearInterval(timer1);
      clearInterval(timer2);
      clearInterval(timer3);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-700 to-blue-500"> {/* Logo */} <div className="mb-4"> <Image src="/logo.png" alt="Institute Logo" width={120} height={120} /> </div>
      <div className="flex flex-col items-center mt-2">
        <Image src="/sipsara.png" alt="සිප්සර" width={300} height={80} />
        <br />
        <h1 className="text-3xl font-bold">අධ්‍යාපන ආයතනය</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8 w-full px-4 max-w-8xl mx-auto">


          {/* Rectangle 1 */}
          <div className="w-full h-64 sm:h-64 lg:h-80 bg-gray-200 rounded-lg overflow-hidden shadow-lg">
            <Image
              src={images1[index1]}
              alt="Slider 1"
              // width/height define intrinsic aspect - CSS will size to container
              width={800}
              height={800}
              className="w-full h-full object-cover transition-all duration-700"
            />
          </div>

          {/* Rectangle 2 */}
          <div className="w-full h-64 sm:h-64 lg:h-80 bg-gray-200 rounded-lg overflow-hidden shadow-lg">
            <Image
              src={images2[index2]}
              alt="Slider 2"
              width={800}
              height={800}
              className="w-full h-full object-cover transition-all duration-700"
            />
          </div>

          {/* Rectangle 3
              - On small screens: occupies full width of grid (col-span auto)
              - On sm (>=640px): spans 2 columns (sm:col-span-2) and we make it taller (sm:h-96)
              - On lg (>=1024px): back to single column span and normal height (lg:h-80)
          */}
          <div className="
            w-full
            h-64
            bg-gray-200
            rounded-lg
            overflow-hidden
            shadow-lg
            sm:col-span-2
            sm:h-96
            lg:col-span-1
            lg:h-80
          ">
            <Image
              src={images3[index3]}
              alt="Slider 3"
              width={1200}
              height={800}
              className="w-full h-full object-cover transition-all duration-700"
            />
          </div>
        </div>
      </div>

      {/* Main container (login/register + info cards) */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-white">
          <h1 className="text-6xl font-bold mb-6">Sipsara Institute</h1>
          <p className="text-2xl mb-8">The Institute of Knowledge</p>
          <div className="flex space-x-10 mt-6 justify-center">
            {/* LOGIN BUTTON */}
            <Link
              href="/login"
              className="
                px-20 py-8 
                rounded-xl 
                font-semibold text-3xl
                bg-green-500
                text-black
                shadow-xl 
                hover:shadow-2xl 
                hover:scale-100 
                hover:brightness-120
                transition-all
                duration-500
                inline-block
              "
            >
              Login
            </Link>

            {/* REGISTER BUTTON */}
            <Link
              href="/register"
              className="
                px-20 py-8 
                rounded-xl 
                font-semibold text-3xl
                bg-green-500
                text-black
                shadow-xl 
                hover:shadow-2xl 
                hover:scale-100 
                hover:brightness-120
                transition-all
                duration-500
                inline-block
              "
            >
              Register
            </Link>
          </div>

        </div>

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
