/** @type {import('next').NextConfig} */
const nextConfig = {
	async redirects() {
		return [{ source: "/liquida", destination: "/black", permanent: false }];
	},
};

export default nextConfig;
