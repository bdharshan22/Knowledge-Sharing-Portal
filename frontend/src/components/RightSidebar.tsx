import { PencilIcon, ChatBubbleOvalLeftIcon } from '@heroicons/react/24/solid';

const RightSidebar = () => {
    return (
        <div className="w-[300px] hidden lg:block pt-6 space-y-4">
            {/* The Overflow Blog Widget */}
            <div className="bg-[#fdf7e2] border border-[#f1e5bc] rounded-md shadow-sm text-[13px]">
                <div className="bg-[#fbf3d5] px-4 py-2 border-b border-[#f1e5bc] font-bold text-gray-700 text-xs">
                    The Knowledge Blog
                </div>
                <ul className="p-4 space-y-3 list-none">
                    <li className="flex gap-2">
                        <PencilIcon className="h-4 w-4 text-gray-600 flex-shrink-0" />
                        <a href="#" className="text-gray-700 hover:text-gray-900">
                            Observability is key to the future of software (and your DevOps career)
                        </a>
                    </li>
                    <li className="flex gap-2">
                        <PencilIcon className="h-4 w-4 text-gray-600 flex-shrink-0" />
                        <a href="#" className="text-gray-700 hover:text-gray-900">
                            Podcast 374: How to build a better developer experience
                        </a>
                    </li>
                </ul>
                <div className="bg-[#fbf3d5] px-4 py-2 border-y border-[#f1e5bc] font-bold text-gray-700 text-xs">
                    Featured on Meta
                </div>
                <ul className="p-4 space-y-3 list-none">
                    <li className="flex gap-2">
                        <ChatBubbleOvalLeftIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <a href="#" className="text-gray-700 hover:text-gray-900">
                            New year, new "Ask Question" wizard
                        </a>
                    </li>
                    <li className="flex gap-2">
                        <ChatBubbleOvalLeftIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <a href="#" className="text-gray-700 hover:text-gray-900">
                            Colors in dark mode are being updated
                        </a>
                    </li>
                </ul>
            </div>

            {/* Custom Filters / Hot Network Questions */}
            <div className="bg-white border border-gray-200 rounded-md shadow-sm p-4">
                <h3 className="font-bold text-gray-700 mb-4 text-sm">Hot Network Questions</h3>
                <ul className="space-y-3 text-[13px]">
                    <li>
                        <a href="#" className="text-blue-600 hover:text-blue-800 block truncate">
                            Why is processing a sorted array faster than processing an unsorted array?
                        </a>
                    </li>
                    <li>
                        <a href="#" className="text-blue-600 hover:text-blue-800 block truncate">
                            How do I undo the most recent local commits in Git?
                        </a>
                    </li>
                    <li>
                        <a href="#" className="text-blue-600 hover:text-blue-800 block truncate">
                            What is the difference between specific heat capacity and heat capacity?
                        </a>
                    </li>
                    <li>
                        <a href="#" className="text-blue-600 hover:text-blue-800 block truncate">
                            Is it possible to execute a function inside a React component?
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default RightSidebar;
