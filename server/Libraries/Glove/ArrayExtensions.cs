﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Glove {
    public static class ArrayExtensions {
        public static T[] Subset<T>(this T[] arr, int offset, int count = -1) {
            var arrEnum = arr.AsEnumerable();

            if(offset > 0)
                arrEnum = arrEnum.Skip(offset);
            if(count > 0 && count < arr.Length)
                arrEnum = arrEnum.Take(count);

            return arrEnum.ToArray();
        }

        public static T[] Range<T>(this T[] arr, int start, int end) {
            return arr.Subset(start, end - start);
        }
    }

    public static class ByteArrayExtensions {
        public static string Base64Encode(this byte[] bytes)
            => Convert.ToBase64String(bytes);

        public static string ToHexString(this byte[] bytes)
            => BitConverter.ToString(bytes).Replace("-", " ");

        public static string GetString(this byte[] bytes, bool isUtf8 = true)
            => isUtf8 ? Encoding.UTF8.GetString(bytes)
                      : Encoding.ASCII.GetString(bytes);

        public static bool IsAsciiString(this byte[] bytes)
            => !bytes.Any(x => x > 0x7F);

        public static byte[] HostToNetworkOrder(this byte[] bytes) {
            if(BitConverter.IsLittleEndian)
                return bytes.Reverse().ToArray();
            else
                return bytes;
        }

        public static byte[] NetworkToHostOrder(this byte[] bytes) {
            return bytes.HostToNetworkOrder();
        }

        public static Single UnpackFloat(this byte[] bytes)
            => BitConverter.ToSingle(bytes.NetworkToHostOrder(), 0);

        public static Double UnpackDouble(this byte[] bytes) 
            => BitConverter.ToDouble(bytes.NetworkToHostOrder(), 0);

        public static Int16 UnpackInt16(this byte[] bytes) 
            => BitConverter.ToInt16(bytes.NetworkToHostOrder(), 0);

        public static UInt16 UnpackUInt16(this byte[] bytes)
            => BitConverter.ToUInt16(bytes.NetworkToHostOrder(), 0);

        public static Int32 UnpackInt32(this byte[] bytes)
            => BitConverter.ToInt32(bytes.NetworkToHostOrder(), 0);

        public static UInt32 UnpackUInt32(this byte[] bytes)
            => BitConverter.ToUInt32(bytes.NetworkToHostOrder(), 0);

        public static Int64 UnpackInt64(this byte[] bytes)
            => BitConverter.ToInt64(bytes.NetworkToHostOrder(), 0);

        public static UInt64 UnpackUInt64(this byte[] bytes)
            => BitConverter.ToUInt64(bytes.NetworkToHostOrder(), 0);
    }
}
